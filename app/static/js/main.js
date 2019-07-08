async function buttonRelease(button) {
    if (!button.hasClass('animation-done')) {
        await animationEnd(button);
    }
    button.removeClass('active animation-done');
}
$('.icon-button').on('mousedown', async function() {
    $(this).addClass('active');
    await animationEnd($(this));
    $(this).addClass('animation-done');
});
$(document).on('mouseup', function(e) {
    buttonRelease($('.icon-button'));
});