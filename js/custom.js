$(document).ready(function () {
    openCloseControl("header > div > div input[data-panel='setPanel']");
    openCloseControl("header > div > div input[data-panel='gnbPanel']");
    openCloseControl(".tradingContainer > div > div > h2 input[data-popup='tip1Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.order_book_area > h2 input[data-popup='tip2Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.transaction_area > h2 input[data-popup='tip3Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.invest_area > div > div:nth-of-type(3) > div > div > div input[data-popup='tip4Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.invest_area > div > div:last-of-type > div input[data-popup='tip5Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(2) > div > div:first-of-type div.list_area table tr th div input[data-popup='tip6Popup']");
    openCloseControl(".tradingContainer > div > div:nth-of-type(2) > div > div:last-of-type div.list_area table tr th div input[data-popup='tip7Popup']");
    openCloseControl(".layer_stoploss_confirm_tit li div input[data-popup='tip8Popup']");
    openCloseControl(".frameWrapper > dl[data-panel='sellBuyPanel']");
    modeSwitch();
    modeSwitch2();
    footerToggleMenu("footer > div > ul li");
    slideUpToggle("header #gnbPanel input[data-toggle='slideToggle']");
    hamMenuBgClick();
    tabMenu(".balanceContainer div ul li", ".balanceContainer div .tabPage");
    tabMenu(".frameWrapper > .invest_area > div > div > div > button", ".frameWrapper > .invest_area > div > div:first-of-type + div");
    tabMenu(".tradingContainer > div > div:nth-of-type(2) > ul li", ".tradingContainer > div > div:nth-of-type(2) > div .tabPage");
    tabMenu(".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.invest_area > div > div:first-of-type > div button", ".tradingContainer > div > div:nth-of-type(3) > div:nth-of-type(2) > div.invest_area > div > div:first-of-type + div");
    priceUpdown(".balanceContainer div #balTab1 form input", "#depositVal");
    targetActive(".pagenation > ol > li a");
    targetToggleActive("[data-panel='sybolPanel']");
    listHeight();
});









function asideFixed(target) {
    var position = $(target).offset().top;

    $(window).scroll(function () {
        var windowVal = $(this).scrollTop();
        console.log(windowVal);
        var finHeightVal = $('footer').height();
        var wrapHeightVal = $('html').height();
        var scrollTopVal = (wrapHeightVal - finHeightVal) - $(target).height() - position;

        if (windowVal > position) {
            if (scrollTopVal + position > windowVal) {
                $(target).css({
                    "position": "fixed",
                    "top": "80px"
                });
            } else {
                $(target).css({
                    "position": "absolute",
                    "top": scrollTopVal + 9
                });
            }
        } else {
            $(target).css({
                "position": "absolute",
                "top": "50px"
            });
        }
    });
}
/* trading Aside Fixed */


function openCloseControl(target) {
    var dataPanel = null;
    var dataPopup = null;

    $(target).click(function () {
        dataPanel = "#" + $(this).attr("data-panel");
        $(dataPanel).addClass("active");
        dataPopup = "#" + $(this).attr("data-popup");
        $(dataPopup).addClass("active");
    });

    $(".closeBtn").click(function () {
        $(dataPanel).removeClass("active");
        $(dataPopup).removeClass("active");
    });
}
/* panel, popup opneClose */


function hamMenuBgClick() {
    $(document).click(function (event) {
        if ($(event.target).closest("#setPanel").get(0) == null && $(event.target).closest("#setBtn").get(0) == null && $(event.target).closest("#gnbPanel").get(0) == null && $(event.target).closest("#gnbBtn").get(0) == null) {
            $("#setPanel").removeClass("active");
            $("#gnbPanel").removeClass("active");
        }
    });
}
/* hamMenu bg Click */


function modeSwitch() {

    var currentMode = localStorage.getItem('currentMode');
    var $darkModeSwitch = document.getElementById('modeSwitch');

    if (currentMode) {
        document.documentElement.classList.add('darkMode');
        document.body.classList.add("dark");
        $darkModeSwitch.checked = true
    }

    $darkModeSwitch.addEventListener('click', () => {
        document.documentElement.classList.toggle('darkMode');
        document.body.classList.add("dark");

        //dark
        if (document.documentElement.classList.contains('darkMode')) {
            localStorage.setItem('currentMode', true);
            document.body.classList.add("dark")
            return;
        }
        //white
        localStorage.removeItem('currentMode');
        document.body.classList.remove("dark");
    })
}


function modeSwitch2() {

    var currentMode = localStorage.getItem('currentMode');
    var $darkModeSwitch2 = document.getElementById('modeSwitch2');

    if (currentMode) {
        document.documentElement.classList.add('darkMode');
        document.body.classList.add("dark");
        $darkModeSwitch2.checked = true
    }

    $darkModeSwitch2.addEventListener('click', () => {
        document.documentElement.classList.toggle('darkMode');
        document.body.classList.add("dark");

        //dark
        if (document.documentElement.classList.contains('darkMode')) {
            localStorage.setItem('currentMode', true);
            document.body.classList.add("dark")
            return;
        }
        //white
        localStorage.removeItem('currentMode');
        document.body.classList.remove("dark");
    })
}
/* dark Mode */


function footerToggleMenu(target) {
    $(target).click(function () {
        $(this).children("ol").toggleClass("active");
        $(this).toggleClass("active");
    });
}
/* footer Toggle Menu */


function slideUpToggle(target) {
    var dataToggle = null;

    $(target).on("click", function () {
        dataToggle = "#" + $(this).attr("data-toggle");
        $(dataToggle).fadeToggle();
    });
}
/* gnb Theme setting Toggle */


function autoHypen(target) {
    target.value = target.value
        .replace(/[^0-9]/g, '')
        .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3").replace(/(\-{1,2})$/g, "");
}
/* joinPage UserTel autoHypen*/


function tabMenu(target, tabPage) {
    $(target).click(function () {
        var activeTab = $(this).attr("data-tabNumb");

        $(target).removeClass("active");
        $(this).addClass("active");

        $(tabPage).removeClass("active");
        $("#" + activeTab).addClass("active");
    });
}
/* tabMenu active */


function listHeight() {
    if (matchMedia("screen and (min-width: 1280px)").matches) {
        $(".tradingContainer > div > div:nth-of-type(3) .tradingOpenClose input").click(function () {
            $(".tradingContainer aside #myGrid").toggleClass("active");
        });
    }
}
/* trading List Height Control */


function priceUpdown(target, target2) {
    $(function () {
        var sum = 0;
        $(target).on('click', function () {
            $(this).each(function () {
                sum += parseInt($(this).data('num'));
            })
            $(target2).val(sum);
        });
        $('.reset').on('click', function () {
            sum = 0;
            $(target2).val(sum);
        });
    });
}
/* balancePage price upDown */


function targetActive(target) {
    $(target).click(function () {
        $(target).removeClass("active");
        $(this).addClass("active");
    });
}
/* add Class Active */


function targetToggleActive(target) {
    var dataPanel = null;

    $(target).click(function () {
        dataPanel = "#" + $(this).attr("data-panel");
        $(dataPanel).toggleClass("active");
    });
}
/* add toggleClass Active */



