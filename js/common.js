// 내역메뉴

function Logout() {
    liq_suspend = true;
}

/*************공통 함수********** */
// 엘리멘트 화면에 표시여부 (뷰포트 내에 있는지)
function isScrolledIntoView(elem) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

// 문자열 뒤에 패딩 문자 추가
function padEnd(maxIndex, char, string) {
    var fillLeng = maxIndex - string.length < 0 ? 0 : maxIndex - string.length;
    var str = '';

    for (var i = 0; i < fillLeng; i++) {
        str += char;
    }
    return string + str;
}

//숫자로 변경 하는 함수
function getOnlyNumber(value) {
    //return Number(value.replace(/[^0-9]/g, ''));
    return Number(value.toString().replace(/,/g, ''));
}

function setComma(value) {
    return value.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

// 날짜 가져오기 flag = 1 인경우 년월일시분초, flag가 2인경우 년월일시분초 조합하여 tradeId 생성 , flag3 은 00시00분00 => 000000 가져와 무료충전횟수를 초기화 하는데 쓴다.
function getDate(flag) {

    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var date = today.getDate();
    var hours = today.getHours();
    var minutes = today.getMinutes();  // 분
    var seconds = today.getSeconds();  // 초
    var milliseconds = today.getMilliseconds(); //밀리초

    month = month < 10 ? "0" + month : month;
    date = date < 10 ? "0" + date : date;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    if (flag == 1) {
        return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    }
    else if (flag == 2) {
        return year + "" + month + "" + date + "" + hours + "" + minutes + "" + seconds;
    }
    else {
        return hours + "" + minutes + "" + seconds;
    }
}

function getCoinName() {
    if (window.location.search) {
        var searchParams = new URLSearchParams(window.location.search);
        return searchParams.get("coinName");
    }
    else {
        return "btcusdt";
    }
}

function stripTag(string) {
    var objStrip = new RegExp();
    objStrip = /[<][^>]*[>]/gi;
    return string.replace(objStrip, "");
}

var click = true;
function clickCheck(obj) {
    if (click) {
        console.log("클릭");
        click = !click;
    } else {
        console.log("중복");
        obj.disabled = true;
        return false;
    }
}

// 레이어팝업
// 창열기  
function openWin(winName) {
    var blnCookie = getCookie(winName);
    var obj = eval("window." + winName);
    if (!blnCookie) {
        obj.style.display = "block";
    }
}
// 창닫기  
function closeWin(winName, expiredays) {
    setCookie(winName, "done", expiredays);
    var obj = eval("window." + winName);
    obj.style.display = "none";
}
function closeWinAt00(winName, expiredays) {
    setCookieAt00(winName, "done", expiredays);
    var obj = eval("window." + winName);
    obj.style.display = "none";
}
// 쿠키 가져오기  
function getCookie(name) {
    var nameOfCookie = name + "=";
    var x = 0;
    while (x <= document.cookie.length) {
        var y = (x + nameOfCookie.length);
        if (document.cookie.substring(x, y) == nameOfCookie) {
            if ((endOfCookie = document.cookie.indexOf(";", y)) == -1)
                endOfCookie = document.cookie.length;
            return unescape(document.cookie.substring(y, endOfCookie));
        }
        x = document.cookie.indexOf(" ", x) + 1;
        if (x == 0)
            break;
    }
    return "";
}

// 시간기준
function setCookie(name, value, expiredays) {
    var now = new Date();
    var time = now.getTime();
    time += 3600 * 1000 * 12; // 12시간
    now.setTime(time);
    document.cookie = name + "=" + escape(value) + "; path=/; expires=" + now.toUTCString() + ";"
}

// 00:00 시 기준 쿠키 설정하기  
// expiredays 의 새벽  00:00:00 까지 쿠키 설정  
function setCookieAt00(name, value, expiredays) {
    var todayDate = new Date();
    todayDate = new Date(parseInt(todayDate.getTime() / 86400000) * 86400000 + 54000000);
    if (todayDate > new Date()) {
        expiredays = expiredays - 1;
    }
    todayDate.setDate(todayDate.getDate() + expiredays);
    document.cookie = name + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";"
}
