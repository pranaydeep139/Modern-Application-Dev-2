from flask import Flask, request, Response, json, make_response, send_file
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from functools import wraps
from datetime import timedelta, date, datetime
import secrets
import os
from PIL import Image
from celery import Celery
from celery.schedules import crontab
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from io import BytesIO, StringIO
from dateutil.relativedelta import relativedelta
import io
import csv
import time
from flask_caching import Cache

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grocery.db'
app.config['JWT_SECRET_KEY'] = 'ifyouarehungryeat'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['CELERY_BROKER_URL'] = 'redis://127.0.0.1:6379/1'
app.config['result_backend'] = 'redis://127.0.0.1:6379/2'
app.config['REDIS_URL'] = 'redis://127.0.0.1:6379'
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_HOST'] = '127.0.0.1'
app.config['CACHE_REDIS_PORT'] = 6379
app.config['CACHE_DEFAULT_TIMEOUT'] = 300


db = SQLAlchemy(app)
api = Api(app)
jwt = JWTManager(app)

def make_celery(app):
	celery = Celery(
		app.import_name,
		broker=app.config['CELERY_BROKER_URL'], result_backend=app.config['result_backend'])
	celery.conf.update(app.config)
	class ContextTask(celery.Task):
		def __call__(self, *args, **kwargs):
			with app.app_context():
				return self.run(*args, **kwargs)
	celery.Task = ContextTask
	return celery
celery=make_celery(app)
app.app_context().push()
celery.conf.enable_utc = True
cache=Cache(app)
app.app_context().push()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(250), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    approved = db.Column(db.Boolean, nullable=False)
    last_purchase = db.Column(db.DateTime, default=None)
    catreqs = db.relationship('Catreq', backref='user', lazy=True)
    carts = db.relationship('Cart', backref='user', lazy=True)

class Manreq(db.Model):
    m_user = db.Column(db.String(50), primary_key=True)

class Category(db.Model):
    c_id = db.Column(db.Integer, primary_key=True)
    c_name = db.Column(db.String(50), unique=True, nullable=False)
    c_desc = db.Column(db.String(250), nullable=False)
    products = db.relationship('Product', backref='category', lazy=True)

class Catreq(db.Model):
    r_id = db.Column(db.Integer, primary_key=True)
    r_name = db.Column(db.String(100), nullable=False)
    r_desc = db.Column(db.Text, nullable=False)
    r_type = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Product(db.Model):
    p_id = db.Column(db.Integer, primary_key=True)
    p_name = db.Column(db.String(100), nullable=False)
    p_unit = db.Column(db.String(50), nullable=False)
    p_cost = db.Column(db.Float, nullable=False)
    p_img = db.Column(db.String(250), nullable=False)
    manuf_date = db.Column(db.Date, nullable=False)
    usage_days = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    category_name = db.Column(db.String, db.ForeignKey('category.c_name'), nullable=False)
    carts = db.relationship('Cart', backref='product', lazy=True)

class Cart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.p_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

class Order(db.Model):
    o_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    product_name = db.Column(db.String, nullable=False)
    p_quantity = db.Column(db.Integer, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user = db.relationship('User', backref='orders', lazy=True)

def customer_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = User.query.get(get_jwt_identity())
        if current_user.role != 'customer':
            message = json.dumps({'message': 'Access denied! Customer privileges required'})
            return Response(message, status=403, mimetype='application/json')
        return fn(*args, **kwargs)
    return wrapper

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = User.query.get(get_jwt_identity())
        if current_user.role != 'admin':
            message = json.dumps({'message': 'Access denied! Customer privileges required'})
            return Response(message, status=403, mimetype='application/json')
        return fn(*args, **kwargs)
    return wrapper

def manager_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = User.query.get(get_jwt_identity())
        if current_user.role not in ['manager', 'admin']:
            message = json.dumps({'message': 'Access denied! Customer privileges required'})
            return Response(message, status=403, mimetype='application/json')
        return fn(*args, **kwargs)
    return wrapper

class APIMessage(Resource):
    def get(self):
        message = json.dumps({'message': 'This is a simple JSON message from the API endpoint'})
        return Response(message, status=200, mimetype='application/json')
    
class UserRegistration(Resource):
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        approved =  data.get('approved')
        if approved == 0:
            new_manreq =  Manreq(m_user=username)
            db.session.add(new_manreq)
            db.session.commit()
            cache.delete('manager_req')
        if not username or not password:
            message = json.dumps({'message': 'Username and Password are required'})
            return Response(message, status=400, mimetype='application/json')
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            message = json.dumps({'message': 'Username already exists'})
            return Response(message, status=409, mimetype='application/json')
        else:
            hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
            new_user = User(
                username=username, password=hashed_password, role=role, approved=approved)
            db.session.add(new_user)
            db.session.commit()
            message = json.dumps({'message': 'User registered successfully!'})
            return Response(message, status=200, mimetype='application/json')

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        if not user:
            message = json.dumps({'message': 'Invalid credentials'})
            return Response(message, status=401, mimetype='application/json')
        if user.role == 'admin':
            if user.password != data['password']:
                message = json.dumps({'message': 'Invalid credentials'})
                return Response(message, status=401, mimetype='application/json')
        else:
            if not check_password_hash(user.password, data['password']):
                message = json.dumps({'message': 'Invalid credentials'})
                return Response(message, status=401, mimetype='application/json')
        if not user.approved:
            message = json.dumps({'message': 'Your request is yet to be approved'})
            return Response(message, status=402, mimetype='application/json')
        token = create_access_token(identity=user.id)
        response_data = {'token': token, 'role': user.role, 'name':user.username}
        message = json.dumps(response_data)
        return Response(message, status=200, mimetype='application/json')
    
class Customer(Resource):
    @jwt_required()
    @customer_required
    @cache.cached(timeout=300, key_prefix='customer')
    def get(self):
        products = Product.query.filter(Product.quantity > 0).order_by(Product.p_id.desc()).all()
        serialized_products = [{
            'p_id': product.p_id,
            'p_name': product.p_name,
            'p_unit': product.p_unit,
            'p_cost': product.p_cost,
            'p_img': product.p_img
        } for product in products]
        return Response(json.dumps(serialized_products), status=200, mimetype='application/json')
    
class Admin(Resource):
    @jwt_required()
    @admin_required
    def get(self):
        manreq_users = Manreq.query.all()
        m_users = [m.m_user for m in manreq_users]
        cat_reqs = Catreq.query.all()
        c_reqs = [c.r_id for c in cat_reqs]
        c_len=len(c_reqs)
        current_user = User.query.get(get_jwt_identity())
        products = Product.query.filter(Product.quantity >= 0).order_by(Product.p_id.desc()).all()
        serialized_products = [{
            'p_id': product.p_id,
            'p_name': product.p_name,
            'p_unit': product.p_unit,
            'p_cost': product.p_cost,
            'p_img': product.p_img
        } for product in products]
        resp = json.dumps({'message': 'This is Admin Dashboard'
                           , 'm_users': m_users, 'c_len': c_len, 'user_role': current_user.role
                           , 'products': serialized_products})
        return Response(resp, status=200, mimetype='application/json')
    
class Manager_req(Resource):
    @jwt_required()
    @admin_required
    @cache.cached(timeout=300, key_prefix='manager_req')
    def get(self):
        manreq_users = Manreq.query.all()
        m_users = [m.m_user for m in manreq_users]
        current_user = User.query.get(get_jwt_identity())
        resp = json.dumps({'m_users': m_users, 'user_role': current_user.role})
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @admin_required
    def post(self):
        data = request.get_json()
        m_user = data.get('m_user')
        manreq_user = Manreq.query.filter_by(m_user=m_user).first()
        if not manreq_user:
            message = json.dumps({'message': 'User not found in Manager Requests'})
            return Response(message, status=404, mimetype='application/json')
        if 'approve' in data:
            user_to_approve = User.query.filter_by(username=m_user).first()
            if user_to_approve:
                user_to_approve.approved = True
                db.session.commit()
            db.session.delete(manreq_user)
            db.session.commit()
            cache.delete('manager_req')
            message = json.dumps({'message1': f'User {m_user} has been approved'})
            return Response(message, status=200, mimetype='application/json')
        elif 'delete' in data:
            user_to_delete = User.query.filter_by(username=m_user).first()
            db.session.delete(user_to_delete)
            db.session.commit()
            db.session.delete(manreq_user)
            db.session.commit()
            cache.delete('manager_req')
            message = json.dumps({'message2': 'Request successfully declined!'})
            return Response(message, status=200, mimetype='application/json')
        resp2 = json.dumps({'message': 'Invalid action'})
        return Response(resp2, status=400, mimetype='application/json')
    
class Category_req(Resource):
    @jwt_required()
    @admin_required
    @cache.cached(timeout=300, key_prefix='category_req')
    def get(self):
        cat_requests = Catreq.query.all()
        cat_requests_list = [{
            "r_id": request.r_id,
            "r_name": request.r_name,
            "r_desc": request.r_desc,
            "username": User.query.filter_by(id=request.user_id).first().username,
            "r_type": request.r_type
        } for request in cat_requests]
        c_list = json.dumps(cat_requests_list)
        return Response(c_list, status=200, mimetype='application/json')
    @jwt_required()
    @admin_required
    def post(self):
        data = request.get_json()
        if 'approve' in data:
            request_id = data.get('r_id')
            request_type = data.get('r_type')
            cat_request = Catreq.query.get(request_id)
            if cat_request:
                if request_type == 'create':
                    existing_cat = Category.query.filter_by(c_name=cat_request.r_name).first()
                    if existing_cat:
                        message = json.dumps({'message': 'Category already exists'})
                        return Response(message, status=409, mimetype='application/json')
                    new_category = Category(
                        c_name=cat_request.r_name,
                        c_desc=cat_request.r_desc
                    )
                    db.session.add(new_category)
                    db.session.commit()
                    db.session.delete(cat_request)
                    db.session.commit()
                    cache.delete('new_pro')
                    cache.delete('cat_list')
                    cache.delete('search')
                    cache.delete('category_req')
                    message = json.dumps({'message': f'Category "{cat_request.r_name}" has been approved'})
                    return Response(message, status=200, mimetype='application/json')
                if request_type == 'edit':
                    category = Category.query.filter_by(c_name=cat_request.r_name).first()
                    if category:
                        category.c_desc = cat_request.r_desc
                        db.session.delete(cat_request)
                        db.session.commit()
                        cache.delete_memoized(get_category, category.c_id)
                        cache.delete('cat_list')
                        cache.delete('category_req')
                        message = json.dumps({'message': f'Category "{cat_request.r_name}" has been updated'})
                        return Response(message, status=200, mimetype='application/json')
                    else:
                        message = json.dumps({'message': 'Category not found'})
                        return Response(message, status=404, mimetype='application/json')
                if request_type == 'delete':
                    category = Category.query.filter_by(c_name=cat_request.r_name).first()
                    if category:
                        try:
                            Cart.query.filter(Cart.product_id.in_(
                                db.session.query(Product.p_id).filter_by(category_name=category.c_name)
                            )).delete(synchronize_session='fetch')
                            db.session.commit()
                            Product.query.filter_by(category_name=category.c_name).delete()
                            db.session.commit()
                            db.session.delete(category)
                            db.session.commit()
                            db.session.delete(cat_request)
                            db.session.commit()
                            cache.delete('cat_list')
                            cache.delete('new_pro')
                            cache.delete('customer')
                            cache.delete('manager')
                            cache.delete_memoized(get_category, category.c_id)
                            cache.delete('search')
                            cache.delete('category_req')
                            message = json.dumps({'message': f'Category "{cat_request.r_name}" and associated products deleted successfully'})
                            return Response(message, status=200, mimetype='application/json')
                        except Exception as e:
                            db.session.rollback()
                            message = json.dumps({'message': f'Failed to delete category: {str(e)}'})
                            return Response(message, status=500, mimetype='application/json')
                    else:
                        message = json.dumps({'message': 'Category not found'})
                        return Response(message, status=404, mimetype='application/json')
            else:
                message = json.dumps({'message': 'Request not found'})
                return Response(message, status=404, mimetype='application/json')
        elif 'delete' in data:
            request_id = data.get('r_id')
            cat_request = Catreq.query.get(request_id)
            if cat_request:
                db.session.delete(cat_request)
                db.session.commit()
                cache.delete('category_req')
                message = json.dumps({'message': 'Request successfully deleted!'})
                return Response(message, status=200, mimetype='application/json')
            else:
                message = json.dumps({'message': 'Request not found'})
                return Response(message, status=404, mimetype='application/json')
        else:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')

    
class Manager(Resource):
    @jwt_required()
    @manager_required
    @cache.cached(timeout=300, key_prefix='manager')
    def get(self):
        products = Product.query.filter(Product.quantity >= 0).order_by(Product.p_id.desc()).all()
        serialized_products = [{
            'p_id': product.p_id,
            'p_name': product.p_name,
            'p_unit': product.p_unit,
            'p_cost': product.p_cost,
            'p_img': product.p_img
        } for product in products]
        return Response(json.dumps(serialized_products), status=200, mimetype='application/json')
    
class NewCategory(Resource):
    @jwt_required()
    @manager_required
    def post(self):
        data = request.get_json()
        c_name = data.get('c_name')
        c_desc = data.get('c_desc')
        if not c_name or not c_desc:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')
        cu_id = get_jwt_identity()
        current_user = User.query.get(cu_id)
        if current_user.role == 'admin':
            existing_cat = Category.query.filter_by(c_name=c_name).first()
            if existing_cat:
                message = json.dumps({'message': f'Category {c_name} already exists'})
                return Response(message, status=409, mimetype='application/json')
            new_category = Category(c_name=c_name, c_desc=c_desc)
            db.session.add(new_category)
            db.session.commit()
            cache.delete('new_pro')
            cache.delete('cat_list')
            cache.delete('search')
            message = json.dumps({'message': 'New category created successfully!'
                                  , 'role': current_user.role})
            return Response(message, status=201, mimetype='application/json')
        if current_user.role == 'manager':
            new_catreq = Catreq(r_name=c_name, r_desc=c_desc, r_type='create', user_id=current_user.id)
            db.session.add(new_catreq)
            db.session.commit()
            cache.delete('category_req')
            message = json.dumps({'message': 'Your request to create the category is successful!'
                                  , 'role': current_user.role})
            return Response(message, status=201, mimetype='application/json')
        
class EditCategory(Resource):
    @jwt_required()
    @manager_required
    def get(self, category_id):
        category = Category.query.get(category_id)
        if not category:
            return Response(json.dumps({'message': 'Category not found'}), status=404, mimetype='application/json')
        category_data={
            'c_name': category.c_name,
            'c_desc': category.c_desc
        }
        resp = json.dumps(category_data)
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @manager_required
    def put(self, category_id):
        data = request.form
        category = Category.query.get(category_id)
        if not category:
            return Response(json.dumps({'message': 'Category not found'}), status=404, mimetype='application/json')
        current_user = User.query.get(get_jwt_identity())
        if data.get('c_desc'):
            if current_user.role == 'admin':
                category.c_desc = data.get('c_desc')
                db.session.commit()
                cache.delete_memoized(get_category, category_id)
                cache.delete('cat_list')
                return Response(json.dumps({'message': 'Category updated successfully'}), status=200, mimetype='application/json')
            if current_user.role == 'manager':
                print(data.get('c_name'))
                new_catreq = Catreq(r_name=data.get('c_name')
                                    , r_desc=data.get('c_desc'), r_type='edit', user_id=current_user.id)
                db.session.add(new_catreq)
                db.session.commit()
                cache.delete('category_req')
                return Response(json.dumps({'message': 'Category update requested'}), status=200, mimetype='application/json')
        else:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')


class NewProduct(Resource):
    @jwt_required()
    @manager_required
    @cache.cached(timeout=120, key_prefix='new_pro')
    def get(self):
        cats = Category.query.all()
        categories = [c.c_name for c in cats]
        resp = json.dumps({'categories': categories})
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @manager_required
    def post(self):
        data = request.form
        p_name = data.get('p_name')
        existing_pro = Product.query.filter_by(p_name=p_name).first()
        if existing_pro:
            return Response(json.dumps({'message': f'Product {p_name} already exists!'}), status=409, mimetype='application/json')
        p_unit = data.get('p_unit')
        p_cost = data.get('p_cost')
        quantity = data.get('quantity')
        manuf_date_day = data.get('manuf_date_day')
        manuf_date_month = data.get('manuf_date_month')
        manuf_date_year = data.get('manuf_date_year')
        usage_days = data.get('usage_days')
        selected_category = data.get('selectedCategory')
        manuf_date = date(int(manuf_date_year), int(manuf_date_month), int(manuf_date_day))
        p_img = request.files['p_img']
        if p_name and p_unit and p_cost and float(p_cost)>0 and usage_days and int(usage_days)>0 and selected_category and quantity and int(quantity)>0:
            random = secrets.token_hex(8)
            _, exten = os.path.splitext(p_img.filename)
            newname = random + exten
            picpath = os.path.join(app.root_path, 'static/images', newname)
            size=(128,128)
            i = Image.open(p_img)
            i.thumbnail(size)
            i.save(picpath) 
            new_product = Product(
                p_name=p_name,
                p_unit=p_unit,
                p_cost=p_cost,
                p_img=newname,
                manuf_date=manuf_date,
                usage_days=usage_days,
                quantity=quantity,
                category_name=selected_category
            )
            db.session.add(new_product)
            db.session.commit()
            cache.delete('customer')
            cache.delete('manager')
            cat=Category.query.filter_by(c_name=selected_category).first()
            cache.delete_memoized(get_category, cat.c_id)
            cache.delete('search')
            cache.delete('new_pro')
            message = json.dumps({'message': 'New product created successfully!'})
            return Response(message, status=201, mimetype='application/json')
        else:
            message = json.dumps({'message': 'Invalid request'})
            return Response(message, status=400, mimetype='application/json')
    
class EditProduct(Resource):
    @jwt_required()
    @manager_required
    def get(self, product_id):
        product = Product.query.get(product_id)
        if not product:
            return Response(json.dumps({'message': 'Product not found'}), status=404, mimetype='application/json')
        cats = Category.query.all()
        categories = [c.c_name for c in cats]
        product_data = {
            'p_name': product.p_name,
            'p_unit': product.p_unit,
            'p_cost': product.p_cost,
            'manuf_date_year': product.manuf_date.year,
            'manuf_date_month': product.manuf_date.month,
            'manuf_date_day': product.manuf_date.day,
            'usage_days': product.usage_days,
            'quantity': product.quantity,
            'selectedCategory': product.category_name,
            'categories': categories
        }
        resp = json.dumps(product_data)
        return Response(resp, status=200, mimetype='application/json')
    @jwt_required()
    @manager_required
    def put(self, product_id):
        data = request.form
        product = Product.query.get(product_id)
        if not product:
            return Response(json.dumps({'message': 'Product not found'}), status=404, mimetype='application/json')
        if data.get('p_cost') and float(data.get('p_cost'))>0:
            product.p_cost=data.get('p_cost')
            db.session.commit()
        if data.get('selectedCategory'):
            product.category_name=data.get('selectedCategory')
            db.session.commit()
        if data.get('usage_days') and int(data.get('usage_days'))>0:
            product.usage_days=data.get('usage_days')
            db.session.commit()
        if data.get('quantity') and int(data.get('quantity'))>=0:
            product.quantity=data.get('quantity')
            db.session.commit()
        if 'p_img' in request.files:
            p_img = request.files['p_img']
            if p_img.filename != '':
                random = secrets.token_hex(8)
                _, exten = os.path.splitext(p_img.filename)
                newname = random + exten
                picpath = os.path.join(app.root_path, 'static/images', newname)
                size = (128, 128)
                i = Image.open(p_img)
                i.thumbnail(size)
                i.save(picpath)
                product.p_img = newname
                db.session.commit()
        cache.delete('customer')
        cache.delete('manager')
        cat=Category.query.filter_by(c_name=product.category_name).first()
        cache.delete_memoized(get_category, cat.c_id)
        cache.delete('search')
        return Response(json.dumps({'message': 'Product updated successfully'}), status=200, mimetype='application/json')

class ProductPage(Resource):
    @jwt_required()
    def get(self, product_id):
        product = Product.query.filter_by(p_id=product_id).first()
        user = User.query.get(get_jwt_identity())
        category = Category.query.filter_by(c_name=product.category_name).first()
        if product:
            serialized_product = {
                'p_id': product.p_id,
                'p_name': product.p_name,
                'p_unit': product.p_unit,
                'p_cost': product.p_cost,
                'p_img': product.p_img,
                'category_name': product.category_name,
                'category_id': category.c_id,
                'manuf_date': product.manuf_date.strftime("%Y-%m-%d"), 
                'usage_days': product.usage_days,
                'quantity': product.quantity,
                'u_role': user.role
            }
            resp = json.dumps(serialized_product)
            return Response(resp, status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Product not found'}), status=404, mimetype='application/json')
    @jwt_required()
    @customer_required
    def post(self, product_id):
        data = request.form
        user_id = get_jwt_identity() 
        quantity = int(data.get('quantity'))
        product = Product.query.filter_by(p_id=product_id).first()
        if product:
            if data.get('type')=='cart':
                existing_cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
                if existing_cart_item:
                    existing_cart_item.quantity += quantity
                    db.session.commit()
                else:
                    new_cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
                    db.session.add(new_cart_item)
                    db.session.commit()
                return Response(json.dumps({'message': 'Product added to cart!'}), status=200, mimetype='application/json')
            if data.get('type')=='buy':
                user = User.query.get(user_id)
                available_quantity = product.quantity
                if quantity > available_quantity:
                    return Response(json.dumps({'message': 'Selected quantity exceeds available quantity'}), status=400, mimetype='application/json')
                total_cost = product.p_cost * quantity
                timestamp = datetime.utcnow()
                if quantity <= available_quantity:
                    product.quantity -= quantity
                    db.session.commit()
                    new_order = Order(user_id=user_id, product_name=product.p_name, p_quantity=quantity, total_cost=total_cost, timestamp=timestamp)
                    db.session.add(new_order)
                    db.session.commit()
                    user.last_purchase = datetime.utcnow()
                    db.session.commit()
                    return Response(json.dumps({'message': 'Product bought successfully'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Product not found'}), status=404, mimetype='application/json')
    @jwt_required()
    @manager_required
    def delete(self, product_id):
        product = Product.query.get(product_id)
        if not product:
            return Response(json.dumps({'message': 'Product not found'}), status=404, mimetype='application/json')
        try:
            Cart.query.filter_by(product_id=product_id).delete()
            db.session.delete(product)
            db.session.commit()
            cache.delete('customer')
            cache.delete('manager')
            cat=Category.query.filter_by(c_name=product.category_name).first()
            cache.delete_memoized(get_category, cat.c_id)
            cache.delete('search')
            return Response(json.dumps({'message': f'Product {product.p_name} deleted successfully'}), status=200, mimetype='application/json')
        except Exception as e:
            db.session.rollback()
            return Response(json.dumps({'message': f'Failed to delete product: {str(e)}'}), status=500, mimetype='application/json')

@cache.memoize(timeout=120)
def get_category(category_id):
    category = Category.query.filter_by(c_id=category_id).first()
    user = User.query.get(get_jwt_identity())
    if category:
        serialized_category = {
            'c_id': category.c_id,
            'c_name': category.c_name,
            'c_desc': category.c_desc,
            'u_role': user.role,
            'products': [{
                'p_id': product.p_id,
                'p_name': product.p_name,
                'p_unit': product.p_unit,
                'p_cost': product.p_cost,
                'p_img': product.p_img,
                'manuf_date': product.manuf_date.strftime("%Y-%m-%d"),
                'usage_days': product.usage_days,
                'quantity': product.quantity
            } for product in category.products]
        }
        resp = json.dumps(serialized_category)
        return Response(resp, status=200, mimetype='application/json')
    else:
        return Response(json.dumps({'message': 'Category not found'}), status=404, mimetype='application/json')

class CategoryPage(Resource):
    @jwt_required()
    def get(self, category_id):
        cat_data = get_category(category_id)
        return cat_data
    @jwt_required()
    @manager_required
    def delete(self, category_id):
        category = Category.query.get(category_id)
        if not category:
            return Response(json.dumps({'message': 'Category not found'}), status=404, mimetype='application/json')
        try:
            user_id = get_jwt_identity()
            user_role = User.query.get(user_id).role
            if user_role == 'admin':
                Cart.query.filter(Cart.product_id.in_(
                    db.session.query(Product.p_id).filter_by(category_name=category.c_name)
                )).delete(synchronize_session='fetch')
                db.session.commit()
                Product.query.filter_by(category_name=category.c_name).delete()
                db.session.commit()
                db.session.delete(category)
                db.session.commit()
                Catreq.query.filter_by(r_type='delete', r_name=category.c_name).delete()
                db.session.commit()
                cache.delete('cat_list')
                cache.delete('new_pro')
                cache.delete('customer')
                cache.delete('manager')
                cache.delete_memoized(get_category, category_id)
                cache.delete('search')
                return Response(json.dumps({'message': f'Category {category.c_name} and its products deleted successfully'}), status=200, mimetype='application/json')
            elif user_role == 'manager':
                existing_catreq=Catreq.query.filter_by(r_type='delete', r_name=category.c_name).first()
                if existing_catreq:
                    return Response(json.dumps({'message': f'Category {category.c_name} is already requested to be deleted'}), status=409, mimetype='application/json')
                catreq = Catreq(
                    r_name=category.c_name,
                    r_desc=category.c_desc,
                    r_type='delete',
                    user_id=user_id
                )
                db.session.add(catreq)
                db.session.commit()
                cache.delete('category_req')
                return Response(json.dumps({'message': 'Deletion request submitted to the admin'}), status=200, mimetype='application/json')
            else:
                return Response(json.dumps({'message': 'Unauthorized'}), status=403, mimetype='application/json')
        except Exception as e:
            db.session.rollback()
            return Response(json.dumps({'message': f'Failed to delete category: {str(e)}'}), status=500, mimetype='application/json')
        
class CartPage(Resource):
    @jwt_required()
    @customer_required
    def get(self):
        user_id = get_jwt_identity()
        user_cart = Cart.query.filter_by(user_id=user_id).all()
        if user_cart:
            products = []
            total_cost = 0
            for cart_item in user_cart:
                product = Product.query.get(cart_item.product_id)
                if product:
                    sub_total = product.p_cost * cart_item.quantity
                    products.append({
                        'p_id': product.p_id,
                        'p_name': product.p_name,
                        'p_unit': product.p_unit,
                        'p_img': product.p_img,
                        'c_quantity': cart_item.quantity,
                        'p_quantity': product.quantity,
                        'subTotal': sub_total,
                        'category_name': product.category_name
                    })
                    total_cost += sub_total
            cart_details = {
                'products': products,
                'totalCost': total_cost
            }
            resp = json.dumps(cart_details)
            return Response(resp, status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Cart is empty'}), status=404, mimetype='application/json')
    @jwt_required()
    @customer_required
    def post(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        user_cart = Cart.query.filter_by(user_id=user_id).all()
        if user_cart:
            for cart_item in user_cart:
                product = Product.query.get(cart_item.product_id)
                if product:
                    if cart_item.quantity <= product.quantity:
                        product.quantity -= cart_item.quantity
                        db.session.commit()
                        new_order = Order(
                            user_id=user_id,
                            product_name=product.p_name,
                            p_quantity=cart_item.quantity,
                            total_cost=product.p_cost * cart_item.quantity
                        )
                        db.session.add(new_order)
                        db.session.commit()
                        user.last_purchase = datetime.utcnow()
                        db.session.commit()
                    else:
                        temp_quantity=product.quantity
                        product.quantity = 0
                        db.session.commit()
                        new_order = Order(
                            user_id=user_id,
                            product_name=product.p_name,
                            p_quantity=temp_quantity,
                            total_cost=product.p_cost * temp_quantity
                        )
                        db.session.add(new_order)
                        db.session.commit()
                        user.last_purchase = datetime.utcnow()
                        db.session.commit()
            Cart.query.filter_by(user_id=user_id).delete()
            db.session.commit()
            return Response(json.dumps({'message': 'Cart purchased successfully'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Cart is empty'}), status=404, mimetype='application/json')
    @jwt_required()
    @customer_required
    def delete(self, product_id):
        user_id = get_jwt_identity()
        cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
        if cart_item:
            db.session.delete(cart_item)
            db.session.commit()
            return Response(json.dumps({'message': 'Item removed from cart'}), status=200, mimetype='application/json')
        else:
            return Response(json.dumps({'message': 'Item not found in cart'}), status=404, mimetype='application/json')

class Search(Resource):
    @jwt_required()
    @cache.cached(timeout=120, key_prefix='search')
    def get(self):
        try:
            search_term = request.args.get('searchTerm', '').lower()
            selected_category = request.args.get('selectedCategory', 'all')
            max_price = request.args.get('maxPrice')
            if selected_category == 'all':
                if max_price:
                    filtered_products = Product.query.filter(Product.p_name.ilike(f'%{search_term}%'),
                                                             Product.p_cost <= max_price).all()
                else:
                    filtered_products = Product.query.filter(Product.p_name.ilike(f'%{search_term}%')).all()
            else:
                category = Category.query.filter_by(c_name=selected_category).first()
                if not category:
                    return Response(json.dumps({'message': 'Category not found'}), status=404, mimetype='application/json')
                category_products = category.products
                if max_price:
                    filtered_products = [product for product in category_products
                                         if product.p_name.lower().find(search_term) != -1
                                         and product.p_cost <= float(max_price)]
                else:
                    filtered_products = [product for product in category_products
                                         if product.p_name.lower().find(search_term) != -1]
            serialized_products = [{
                'p_id': product.p_id,
                'p_name': product.p_name,
                'p_unit': product.p_unit,
                'p_cost': product.p_cost,
                'p_img': product.p_img,
                'manuf_date': product.manuf_date.strftime("%Y-%m-%d"),
                'usage_days': product.usage_days,
                'quantity': product.quantity,
                'category_name': product.category_name
            } for product in filtered_products]
            categories = Category.query.all()
            cats = [c.c_name for c in categories]
            resp = json.dumps({'serialized_products': serialized_products, 'cats': cats})
            return Response(resp, status=200, mimetype='application/json')
        except Exception as e:
            return Response(json.dumps({'message': f'Error: {str(e)}'}), status=500, mimetype='application/json')
        
class CategoryList(Resource):
    @jwt_required()
    @cache.cached(timeout=120, key_prefix='cat_list')
    def get(self):
        categories = Category.query.all()
        serialized_categories = [{
            'c_id': category.c_id,
            'c_name': category.c_name,
            'c_desc': category.c_desc
        } for category in categories]
        return Response(json.dumps(serialized_categories), status=200, mimetype='application/json')
    
@celery.task
def send_reminder():
    last_24_hours = datetime.utcnow() - timedelta(hours=24)
    users_to_remind = User.query.filter((User.last_purchase < last_24_hours) | (User.last_purchase == None), User.role == 'customer').all()
    for user in users_to_remind:
        sender='ashyketchum1234@gmail.com'
        recipient='pranaydeep139@gmail.com' #user's email
        subject='Web Grocery Store Reminder'
        message=f'Hi, {user.username}! You have not made a purchase today. Check out our new products!'
        msg = MIMEMultipart()
        msg['From']=sender
        msg['To']=recipient
        msg['Subject']=subject
        msg.attach(MIMEText(message))
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_username='ashyketchum1234@gmail.com'
        smtp_password='efebsycocftdihnf'
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(sender, recipient, msg.as_string())

def customer_report(user_id):
    user_orders = Order.query.filter_by(user_id=user_id).all()
    user = User.query.get(user_id)
    html_content = f'''
    <html>
    <head>
        <title>{user.username}'s Monthly Report</title>
    </head>
    <body>
        <h1>{user.username}'s Monthly Report</h1>
        <h2>Your orders in the last month:</h2>
    '''
    total_spent = 0
    for order in user_orders:
        html_content += f'''
        <div>
            <h4>Order ID: {order.o_id}</h4>
            <p>Product Name: {order.product_name}</p>
            <p>Product Quantity: {order.p_quantity}</p>
            <p>Total Cost: Rs.{order.total_cost:.2f}</p>
        </div>
        '''
        total_spent += order.total_cost
    html_content += f'''
        <h3>Total Money Spent: Rs.{total_spent:.2f}</h3>
        <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    </body>
    </html>
    '''
    return html_content

@celery.task
def mail_report():
    last_month = datetime.utcnow() - relativedelta(months=1)
    orders_to_delete = Order.query.filter(Order.timestamp < last_month).all()
    for order in orders_to_delete:
        db.session.delete(order)
        db.session.commit()
    users_to_report = User.query.filter(User.role == 'customer', User.last_purchase.isnot(None)).all()
    for user in users_to_report:
        sender = 'ashyketchum1234@gmail.com'
        recipient = 'pranaydeep139@gmail.com'  # user's email
        subject = 'Monthly Report - Web Grocery Store'
        message = f'Hi, {user.username}! Here is the monthly report of your shopping with us!'
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(message))
        html_report = customer_report(user.id)
        attachment = MIMEText(html_report, 'html')
        attachment.add_header('Content-Disposition', f'attachment; filename=customer_report_{user.id}.html')
        msg.attach(attachment)
        smtp_server = 'smtp.gmail.com'
        smtp_port = 587
        smtp_username = 'ashyketchum1234@gmail.com'
        smtp_password = 'efebsycocftdihnf'
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(sender, recipient, msg.as_string())


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        crontab(hour=10, minute=43),
        send_reminder.s(),
    )
    sender.add_periodic_task(
        crontab(day_of_month=30, hour=10, minute=43),
        mail_report.s(),
    )

@app.route('/api/exportcsv', methods=['GET'])
@jwt_required()
@manager_required
def generate_csv_task():
    products = Product.query.all()
    orders = Order.query.all()
    product_details = []
    for product in products:
        items_sold = sum(order.p_quantity for order in orders if order.product_name == product.p_name)
        product_info = {
            'ID': product.p_id,
            'Name': product.p_name,
            'Unit': product.p_unit,
            'Category': product.category_name,
            'In Stock Quantity': product.quantity,
            'Price': product.p_cost,
            'Items Sold': items_sold
        }
        product_details.append(product_info)
    output = io.StringIO()
    csv_writer = csv.DictWriter(output, fieldnames=['ID', 'Name', 'Unit', 'Category', 'In Stock Quantity', 'Price', 'Items Sold'])
    csv_writer.writeheader()
    csv_writer.writerows(product_details)
    output.seek(0)
    return Response(output, mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=product_details.csv'})

api.add_resource(APIMessage, '/api')
api.add_resource(UserRegistration, '/api/register')
api.add_resource(UserLogin, '/api/login')
api.add_resource(Customer, '/api/customer')
api.add_resource(Admin, '/api/admin')
api.add_resource(Manager, '/api/manager')
api.add_resource(Manager_req, '/api/manreq')
api.add_resource(Category_req, '/api/catreq')
api.add_resource(NewCategory, '/api/createcat')
api.add_resource(NewProduct, '/api/createpro')
api.add_resource(EditProduct, '/api/editpro/<int:product_id>')
api.add_resource(EditCategory, '/api/editcat/<int:category_id>')
api.add_resource(ProductPage, '/api/product/<int:product_id>')
api.add_resource(CategoryPage, '/api/category/<int:category_id>')
api.add_resource(CartPage, '/api/cart', '/api/cart/buy', '/api/cart/remove/<int:product_id>')
api.add_resource(Search, '/api/search')
api.add_resource(CategoryList, '/api/categories')

if __name__ == '__main__':
    app.run(debug=True)
