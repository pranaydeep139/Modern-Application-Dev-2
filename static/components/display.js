export default {
  template: `<div>{{ message }}</div>`,
  data() {
    return {
      message: 'Loading...'
    };
  },
  mounted() {
    fetch('http://127.0.0.1:5000/api')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.message = data.message;
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        this.message = 'Failed to fetch data';
      });
  }
};


  