const calendarSVGObject = document.getElementById('calendar-svg-obj');
calendarSVGObject.addEventListener('load', changeDate);

function changeDate() {
    const monthTextElement = calendarSVGObject.contentDocument.getElementById('month-text');
    
    const month = new Date().toLocaleString('default', { month: 'long' });
    monthTextElement.textContent = month;
}