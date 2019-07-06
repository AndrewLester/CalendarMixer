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
$('.icon-button').on('click', async function() {
    await buttonRelease($(this));
});
$(document).on('mouseup', async function(e) {
    if ($(e.target).parents('.icon-button').length === 0) {
        await buttonRelease($('.icon-button'));
    }
});