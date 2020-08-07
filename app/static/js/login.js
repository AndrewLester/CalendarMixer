const input = document.getElementById('form-input-next');
input.value = new URLSearchParams(window.location.search).get('next') || '';
