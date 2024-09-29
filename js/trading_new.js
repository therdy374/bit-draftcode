$(function () {
  if (selectCoinInfo) {
    fixed = selectCoinInfo.fixed;
  }

  var param = JSON.parse(localStorage.getItem("localTradeData"));
  var paramLo = JSON.parse(localStorage.getItem("localTradeLoData"));

  setInitInfo(param);
  setInitLoInfo(paramLo);

  WebsocketinitNew();
  console.log("1 tradeData.dataList : " + tradeData.dataList.length);
  console.log("2 tradeData.dataList : " + tradeData.dataList.length);
});

// 투자 정보를 담는 변수 선언
var tradeData = {
  ask: null,
  bid: null,
  order: {
    ci: "",
    position: "",
    type: "",
    betPoint: 0,
    leverage: 1,
  },
  orderResult: {},
  mbTp: 0,
  mbEstimatedTp: 0,
  cross: false,
  crossTradeId: 0,
  crossIm: 0,
  dataList: [],
  memberBalancePoint: 0,
  realBalancePoint: 0,
  totlaBalancePoint: 0,
};

// 지정가를 담는 변수 선언
var tradeLoData = {
  ask: null,
  bid: null,
  order: {
    ci: "",
    position: "",
    type: "",
    betPoint: 0,
    leverage: 1,
  },
  orderResult: {},
  mbTp: 0,
  mbEstimatedTp: 0,
  cross: false,
  crossTradeId: 0,
  crossIm: 0,
  dataList: [],
  totlaBalancePoint: 0,
};

// STOP DATA 담는 변수 선언
var stopData = {
  type: "",
  tradeId: "",
  ci: "",
  realTradePoint: "",
  nowPrice: "",
  askPrice: "",
  bidPrice: "",
  position: "",
  stopPercent: "",
  stopPrice: "",
  profitPercent: "",
  profitPrice: "",
  buyPrice: "",
  breakPrice: "",
  diffPrice: "",
  fixed: 0,
};

var liq_suspend = false;

var initCharge = 0;
var streams = [];
var socketBookTicker;
var coinName2 = "btcusdt";
var crossType = "";

//청산
var liquidationRowIndex = -1;
var liquidationPercent = 100;

//setInterval timer
var setRenderTimer = null;
var setRenderLoTimer = null;
var isReload = false;
var reloadTimer = null;

function WebsocketinitNew() {
  streams = [];
  let f;

  if (tradeData.dataList.length > 0) {
    for (var i = 0; i < tradeData.dataList.length; i++) {
      f = streams.find(function (item) {
        return item == tradeData.dataList[i].socketUrl + "@bookTicker";
      });
      if (!f) {
        streams.push(tradeData.dataList[i].socketUrl + "@bookTicker");
      }
    }
  } else {
    f = streams.find(function (item) {
      return item == coinName2 + "@bookTicker";
    });
    if (!f) {
      streams.push(coinName2 + "@bookTicker");
    }
  }

  if (tradeLoData.dataList.length > 0) {
    for (var i = 0; i < tradeLoData.dataList.length; i++) {
      f = streams.find(function (item) {
        return item == tradeLoData.dataList[i].socketUrl + "@bookTicker";
      });
      if (!f) {
        streams.push(tradeLoData.dataList[i].socketUrl + "@bookTicker");
      }
    }
  } else {
    f = streams.find(function (item) {
      return item == coinName2 + "@bookTicker";
    });
    if (!f) {
      streams.push(coinName2 + "@bookTicker");
    }
  }

  socketBookTicker = new WebSocket(
    "wss://stream.binance.com:9443/ws/" + streams.join("/")
  );
  socketBookTicker.onopen = function (event) {
    socketOpenSt(event);
  };
  socketBookTicker.onmessage = function (event) {
    socketMessageSt(event);
  };
  socketBookTicker.onclose = function (event) {
    socketCloseSt(event);
  };
}

function socketOpenSt(event) {
  console.log("연결 완료 socketBookTicker");
}

function socketCloseSt(event) {
  console.log("연결 종료 socketBookTicker");
  WebsocketinitNew();
}

function socketMessageSt(event) {
  var data = JSON.parse(event.data);

  if (tradeData.dataList.length > 0) {
    for (var i = 0; i < tradeData.dataList.length; i++) {
      if (data.s == tradeData.dataList[i].symbol) {
        tradeData.dataList[i].ask = parseFloat(data.a);
        tradeData.dataList[i].bid = parseFloat(data.b);
        tradeData.dataList[i].socketCheck = true;
      }
    }
  }

  if (tradeLoData.dataList.length > 0) {
    for (var i = 0; i < tradeLoData.dataList.length; i++) {
      if (data.s == tradeLoData.dataList[i].symbol) {
        tradeLoData.dataList[i].ask = parseFloat(data.a);
        tradeLoData.dataList[i].bid = parseFloat(data.b);
        tradeLoData.dataList[i].socketCheck = true;
      }
    }
  }
}
//웹소켓 종료
function disconnectSt(coinName) {
  coinName2 = coinName;
  socketBookTicker.close();
  console.log("연결 종료 socketBookTicker");
}

function setInitInfo(param, investList) {
  if (param) {
    tradeData = param;
    tradeData.order.ci = "C";
    tradeData.order.betPoint = 0;
    tradeData.order.leverage = maxLeverage;
    tradeData.order.position = "";
    tradeData.order.type = "MARKET";

    $(".mb-tp").text(parseFloat(param.realBalancePoint).toFixed(2) + " USDT");
    if (tradeData.cross == true) {
      $("#liq_crossIm").text("유지증거금");
      $("#marginText").text("총진입설정증거금");
      $(".tradingContainer").addClass('cross');
    } else {
      $("#liq_crossIm").text("예상청산가");
      $(".tradingContainer").removeClass('cross');
    }

    if (tradeData.dataList.length > 0) {
      setDataListInfo();
      console.log("3 tradeData.dataList : " + tradeData.dataList.length);
    }
  } else {
    tradeData.mbTp = 0;
    $(".mb-tp").text(tradeData.realBalancePoint + " USDT");
  }

  setTimeout(function () {
    setRenderLo(); // 지정가 체크 함수
    setRender(); // 수익률 계산 함수 START
  }, 500);
}

function setInitLoInfo(paramLo) {
  if (paramLo) {
    tradeLoData = paramLo;
    tradeLoData.order.betPoint = 0;
    tradeLoData.order.leverage = 1;
    tradeLoData.order.position = "";
    tradeLoData.order.type = "";
    if (tradeLoData.dataList.length > 0) {
      setDataLoListInfo();
      console.log("3 tradeLoData.dataList : " + tradeLoData.dataList.length);
    }
  }
}

// 격리 교차 버튼 이벤트
function selectCI(ele) {
  var selCi = $(ele).data("ci");
  setOrderCI(selCi);
  $(".ci-btn").removeClass("selected");

  if (selCi == "I") {
    $("#btn_isol").addClass("selected");
    $("#Mbtn_isol").addClass("selected");
  } else {
    $("#btn_cross").addClass("selected");
    $("#Mbtn_cross").addClass("selected");
  }
}

// 매수, 매도 버튼 이벤트
function selectPosition(ele) {
  var selPosition = $(ele).data("position");

  setOrderPosition(selPosition);
  $(".position-btn").removeClass("selected");

  if (selPosition == "LONG") {
    $("#btn_long").addClass("selected");
    $("#Mbtn_long").addClass("selected");
  } else {
    $("#btn_short").addClass("selected");
    $("#Mbtn_short").addClass("selected");
  }
}

// 시장가, 지정가 버튼 이벤트
function selectPrice(value) {
  limits = Number(bidsArray[0][0]);

  $(".inprice-btn").removeClass("active");

  if (value == "MARKET") {
    $("#btn_market").addClass("active");
    $("#Mbtn_market").addClass("active");
    $("#limitsTab2").removeClass("active");
    $("#MlimitsTab2").removeClass("active");
  } else {
    $("#btn_limits").addClass("active");
    $("#Mbtn_limits").addClass("active");
    $("#limitsTab2").addClass("active");
    $("#MlimitsTab2").addClass("active");

    $("#limits").val(limits.toFixed(fixed));
    $("#Mlimits").val(limits.toFixed(fixed));
  }
  setOrderType(value);
}

// 지정가 진입가격 up down 버튼 이벤트
function limitsUpDown(ele) {
  limits = $("#limits").val();

  if (ele.indexOf("mo") != -1) limits = $("#Mlimits").val();

  ele = ele.replace("_mo", "");
  var plusVal = 1;
  for (var i = 0; i < fixed; i++) plusVal *= 0.1;
  plusVal = plusVal.toFixed(fixed);
  if (ele == "up") {
    limits = parseFloat(limits) + parseFloat(plusVal);
  } else {
    limits = parseFloat(limits) - parseFloat(plusVal);
  }
  $("#limits").val(limits.toFixed(fixed));
  $("#Mlimits").val(limits.toFixed(fixed));
}

// 주문장 클릭시
// 시장가, 지정가 버튼 이벤트
function selectType(value) {
  $(".inprice-btn").removeClass("active");

  $("#btn_limits").addClass("active");
  $("#Mbtn_limits").addClass("active");
  $("#limitsTab2").addClass("active");
  $("#MlimitsTab2").addClass("active");

  $("#limits").val(value.toFixed(fixed));
  $("#Mlimits").val(value.toFixed(fixed));

  setOrderType(value);
}

// 투자 금액 직접 입력 이벤트
// PC
$("#bet-point").on("input", function () {
  var point = $(this).val();

  $(this).val(parseFloat(point));
  $("#Mbet-point").val(point);

  setOrderBetPoint(point);
});
// MOBILE
$("#Mbet-point").on("input", function () {
  var point = $(this).val();

  $(this).val(parseFloat(point));
  $("#bet-point").val(point);

  setOrderBetPoint(point);
});

// 보유금 직접입력 클릭시 포인트바 나타나는 이벤트
$(".tr_direct_input").click(function () {
  $(".tradeBtn").hide();
  $(".tr_point_bar").show();
});
$(".trade_check").click(function () {
  $(".tr_point_bar").hide();
  $(".tradeBtn").show();
});

// 보유금 % 선택
function trBetPoint(val) {
  $(".tr_btn01").removeClass("selected");
  $(".tr_btn02").removeClass("selected");
  $(".tr_btn03").removeClass("selected");
  $(".tr_btn04").removeClass("selected");
  $(".tr_btn05").removeClass("selected");
  document.getElementById("rangeBetPercent").innerText = "스크롤";
  document.getElementById("MrangeBetPercent").innerText = "스크롤";

  if (val == 10) $(".tr_btn01").toggleClass("selected");
  if (val == 30) $(".tr_btn02").toggleClass("selected");
  if (val == 50) $(".tr_btn03").toggleClass("selected");
  if (val == 100) $(".tr_btn04").toggleClass("selected");

  updateTextInput(val);

  $("#rangeBet").val(val);
  $("#MrangeBet").val(val);

  document.getElementById("displayPercent").innerText = val;
  document.getElementById("MdisplayPercent").innerText = val;
}

// 보유금 스크롤 선택
function trBetFreePoint() {
  $(".tr_btn01").removeClass("selected");
  $(".tr_btn02").removeClass("selected");
  $(".tr_btn03").removeClass("selected");
  $(".tr_btn04").removeClass("selected");
  $(".tr_btn05").removeClass("selected");
  $(".tr_btn05").toggleClass("selected");

  var percent = $("#displayPercent").text();
  $("#rangeBet").val(percent);
  $("#MrangeBet").val(percent);

  const allRanges = document.querySelectorAll(".range-wrap");
  allRanges.forEach((wrap) => {
    const range = wrap.querySelector(".range");
    const bubble = wrap.querySelector(".bubble");

    range.addEventListener("input", () => {
      setBubble(range, bubble);
    });
    setBubble(range, bubble);
  });

  function setBubble(range, bubble) {
    const val = range.value;
    const min = range.min ? range.min : 0;
    const max = range.max ? range.max : 100;
    const newVal = Number(((val - min) * 100) / (max - min));
    bubble.innerHTML = val;
    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }
}

function updateTextInput(val) {
  var balance = tradeData.realBalancePoint;
  var outamt = (val / 100) * balance;

  document.getElementById("displayPercent").innerText = val;
  document.getElementById("MdisplayPercent").innerText = val;

  document.getElementById("bet-point").value = parseFloat(outamt);
  document.getElementById("Mbet-point").value = parseFloat(outamt);

  tradeData.order.leverage = document.getElementById("rangeLeverage").value;
  tradeData.order.leverage = document.getElementById("MrangeLeverage").value;

  setOrderBetPoint(outamt);
}

// 스크롤 확인 버튼
function betChker(val) {
  if (val == "pc") var betPercent = $("#displayPercent").text();
  else var betPercent = $("#MdisplayPercent").text();

  document.getElementById("displayPercent").innerText = betPercent;
  document.getElementById("MdisplayPercent").innerText = betPercent;

  document.getElementById("rangeBetPercent").innerText = "스크롤";
  document.getElementById("MrangeBetPercent").innerText = "스크롤";
}

// 보유금 직접 입력
function updateRange(val) {
  $(".tr_btn01").removeClass("selected");
  $(".tr_btn02").removeClass("selected");
  $(".tr_btn03").removeClass("selected");
  $(".tr_btn04").removeClass("selected");
  $(".tr_btn05").removeClass("selected");
  $(".tr_btn05").toggleClass("selected");

  var balance = tradeData.realBalancePoint;
  var percent = parseFloat((val / balance) * 100).toFixed();
  if (percent > 100) {
    percent = 100;
    document.getElementById("bet-point").value = parseFloat(
      tradeData.realBalancePoint
    );
    document.getElementById("Mbet-point").value = parseFloat(
      tradeData.realBalancePoint
    );
  }
  document.getElementById("rangeBetPercent").innerText = "스크롤";
  document.getElementById("MrangeBetPercent").innerText = "스크롤";

  document.getElementById("displayPercent").innerText = percent;
  document.getElementById("MdisplayPercent").innerText = percent;

  document.getElementById("rangeBet").value = percent;
  document.getElementById("MrangeBet").value = percent;

  tradeData.order.leverage = document.getElementById("rangeLeverage").value;
  tradeData.order.leverage = document.getElementById("MrangeLeverage").value;

  setOrderBetPoint(val);
}

// 투자 금액 버튼 입력 이벤트
function selectBetPointButton(ele) {
  var betPointEle = $("#bet-point");
  var betPoint = betPointEle.val();
  var point = 0;
  var point1 = $(ele).data("point");
  var point2 = Number(getOnlyNumber(betPoint));
  var point3 = Number(point2) + Number(point1);

  switch (point1) {
    case "max":
      point = tradeData.realBalancePoint;
      break;

    case "reset":
      point = 0;
      break;

    default:
      point = point3;
      break;
  }

  betPointEle.val(point);

  setOrderBetPoint(point);
}

// 레버리지
function leBetPoint(val) {
  $(".le_btn01").removeClass("selected");
  $(".le_btn02").removeClass("selected");
  $(".le_btn03").removeClass("selected");
  $(".le_btn04").removeClass("selected");
  $(".le_btn05").removeClass("selected");
  $(".le_btn_direct").removeClass("selected");
  document.getElementById("lePoint").innerText = "스크롤";

  if (val == 10) $(".le_btn01").toggleClass("selected");
  if (val == 25) $(".le_btn02").toggleClass("selected");
  if (val == 50) $(".le_btn03").toggleClass("selected");
  if (val == 100) $(".le_btn04").toggleClass("selected");
  if (val == 125) $(".le_btn05").toggleClass("selected");

  document.getElementById("displayLeverage").innerText = val;
  document.getElementById("MdisplayLeverage").innerText = val;

  updateTextInputLeverage(val);
}

// 레버리지 + - 버튼
function leverageUpDown(updown) {
  $(".le_btn01").removeClass("selected");
  $(".le_btn02").removeClass("selected");
  $(".le_btn03").removeClass("selected");
  $(".le_btn04").removeClass("selected");
  $(".le_btn05").removeClass("selected");
  $(".le_btn_direct").removeClass("selected");
  $(".le_btn_direct").addClass("selected");
  document.getElementById("lePoint").innerText = "스크롤";

  var val = document.getElementById("displayLeverage").innerText;

  if (updown == "up") {
    val++;
    if (val > 125) val = 125;
  }
  if (updown == "down") {
    val--;
    if (val < 1) val = 1;
  }

  if (val > maxLeverage) {
    Swal.fire("현재 코인의 최대 레버리지는 " + maxLeverage + "배 입니다.");
    val = maxLeverage;
  }

  /* 보유금, 레버리지 퍼센티지 툴팁 이벤트 */
  const allRanges = document.querySelectorAll(".range-wrap");
  allRanges.forEach((wrap) => {
    const range = wrap.querySelector(".range");
    const bubble = wrap.querySelector(".bubble");

    range.addEventListener("input", () => {
      setBubble(range, bubble);
    });
    setBubble(range, bubble);
  });

  function setBubble(range, bubble) {
    const val = range.value;
    const min = range.min ? range.min : 0;
    const max = range.max ? range.max : 100;
    const newVal = Number(((val - min) * 100) / (max - min));
    bubble.innerHTML = val;

    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }

  document.getElementById("displayLeverage").innerText = val;
  document.getElementById("MdisplayLeverage").innerText = val;

  document.getElementById("rangeLeverage").value = val;
  document.getElementById("MrangeLeverage").value = val;

  setOrderLeverage(val);
}

// 레버리지 스크롤 확인 버튼
function leverageChker(val) {
  $(".le_btn01").removeClass("selected");
  $(".le_btn02").removeClass("selected");
  $(".le_btn03").removeClass("selected");
  $(".le_btn04").removeClass("selected");
  $(".le_btn05").removeClass("selected");
  $(".le_btn_direct").removeClass("selected");
  $(".le_btn_direct").addClass("selected");

  if (val == "pc") var lePercent = $("#displayLeverage").text();
  else var lePercent = $("#MdisplayLeverage").text();

  document.getElementById("displayLeverage").innerText = lePercent;
  document.getElementById("MdisplayLeverage").innerText = lePercent;

  document.getElementById("lePoint").innerText = "스크롤";
  document.getElementById("MlePoint").innerText = "스크롤";
}

// 레버리지 직접입력 버튼 이벤트
function selectLeverageDirect() {
  $("#leverage-direct-btn").addClass("selected");

  $(".leverage-input").hide();
  $("#leverage-direct").show();

  setOrderLeverage($("#leverage-direct-input").val());
}

// 레버리지 스크롤 클릭시 포인트바 나타나는 이벤트
$(".le_direct_input").click(function () {
  $(".leverageBtn").hide();
  $(".leverage_pointBar").show();
});
$(".leverage_check").click(function () {
  $(".leverage_pointBar").hide();
  $(".leverageBtn").show();
});

function leBetFreePoint() {
  const allRanges = document.querySelectorAll(".range-wrap");
  allRanges.forEach((wrap) => {
    const range = wrap.querySelector(".range");
    const bubble = wrap.querySelector(".bubble");

    range.addEventListener("input", () => {
      setBubble(range, bubble);
    });
    setBubble(range, bubble);
  });

  function setBubble(range, bubble) {
    const val = range.value;
    const min = range.min ? range.min : 0;
    const max = range.max ? range.max : 125;
    const newVal = Number(((val - min) * 100) / (max - min));
    bubble.innerHTML = val;
    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }
}

function updateTextInputLeverage(val) {
  if (val > maxLeverage) {
    Swal.fire("현재 코인의 최대 레버리지는 " + maxLeverage + "배 입니다.");
    val = maxLeverage;

    $(".le_btn01").removeClass("selected");
    $(".le_btn02").removeClass("selected");
    $(".le_btn03").removeClass("selected");
    $(".le_btn04").removeClass("selected");
    $(".le_btn05").removeClass("selected");
    $(".le_btn_direct").removeClass("selected");
    $(".le_btn_direct").addClass("selected");

    document.getElementById("lePoint").innerText = "스크롤";
    document.getElementById("MlePoint").innerText = "스크롤";
  }

  document.getElementById("rangeLeverage").value = val;
  document.getElementById("MrangeLeverage").value = val;

  document.getElementById("displayLeverage").innerText = val;
  document.getElementById("MdisplayLeverage").innerText = val;

  /* 보유금, 레버리지 퍼센티지 툴팁 이벤트 */
  const allRanges = document.querySelectorAll(".range-wrap");
  allRanges.forEach((wrap) => {
    const range = wrap.querySelector(".range");
    const bubble = wrap.querySelector(".bubble");

    range.addEventListener("input", () => {
      setBubble(range, bubble);
    });
    setBubble(range, bubble);
  });

  function setBubble(range, bubble) {
    const val = range.value;
    const min = range.min ? range.min : 0;
    const max = range.max ? range.max : 100;
    const newVal = Number(((val - min) * 100) / (max - min));
    bubble.innerHTML = val;

    bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
  }
  setOrderLeverage(val);
}

// 주문 리셋
function orderReset() {
  $(".tr_btn01").removeClass("selected");
  $(".tr_btn02").removeClass("selected");
  $(".tr_btn03").removeClass("selected");
  $(".tr_btn04").removeClass("selected");
  $(".tr_btn05").removeClass("selected");
  document.getElementById("rangeBetPercent").innerText = "스크롤";

  $(".le_btn01").removeClass("selected");
  $(".le_btn02").removeClass("selected");
  $(".le_btn03").removeClass("selected");
  $(".le_btn04").removeClass("selected");
  $(".le_btn05").removeClass("selected");
  $(".le_btn_direct").removeClass("selected");
  document.getElementById("lePoint").innerText = "스크롤";

  document.getElementById("bet-point").value = 0;
  document.getElementById("Mbet-point").value = 0;

  document.getElementById("displayLeverage").innerText = maxLeverage;

  leBetFreePoint(maxLeverage);
  changeOrderInfo();
}

// 청산 퍼센테이지
function selectLiquidationPercentButton(ele) {
  var balancePoint = getOnlyNumber($(".bet-tp2").html());
  if (balancePoint < 100) {
    Swal.fire("투자금 100 USDT 미만은 100% 청산만 가능합니다.");
    return false;
  }
  liquidationPercent = $(ele).data("percent");

  $(".liquidation-percent-btn").removeClass("selected");
  $(ele).addClass("selected");
}

// 교차 격리 설정
function setOrderCI(ci) {
  tradeData.order.ci = ci;
  changeOrderInfo();
}

// 투자 포지션 설정
function setOrderPosition(position) {
  tradeData.order.position = position;
  changeOrderInfo();
}

// 투자 타입(시장가, 지정가) 설정
function setOrderType(type) {
  tradeData.order.type = type;
  changeOrderInfo();
}

// 투자포인트 설정
function setOrderBetPoint(betPoint) {
  tradeData.order.betPoint = betPoint;
  changeOrderInfo();
}

// 투자 레버리지 설정
function setOrderLeverage(leverage) {
  tradeData.order.leverage = leverage;
  changeOrderInfo();
}

// 투자 정보 입력 설정
function changeOrderInfo() {
  var buyPrice = getBuyPrice();
  var orderInfo = tradeData.order;

  //투자 정보를 이용한 결과 조회
  var orderResult = getOrderResult(
    orderInfo.ci,
    orderInfo.type,
    orderInfo.betPoint,
    orderInfo.leverage,
    orderInfo.position,
    buyPrice
  );

  tradeData.orderResult = orderResult;

  //주문 확인서 정보 업데이트
  updateOrderConfirm(orderResult);

  //수수료 포인트
  $(".fee-tp").html(orderResult.feePoint.toFixed(8));
}

// 포지션에 맞는 가격 조회(시장가)
function getBuyPrice() {
  var className = $("#btn_market").attr("class");

  var buyPrice;

  if (className.indexOf("active") != -1) {
    tradeData.order.type = "MARKET";
    if (tradeData.order.position == "LONG") {
      buyPrice = tradeData.ask;
    } else {
      buyPrice = tradeData.bid;
    }
  } else {
    tradeData.order.type = "LIMITS";

    let moCheck = $("#sellBuyPanel").css("display");
    if (moCheck == "block") {
      buyPrice = $("#Mlimits").val();
    } else {
      buyPrice = $("#limits").val();
    }
  }

  return buyPrice;
}

// 투자 결과 정보 조회
function getOrderResult(ci, type, betPoint, leverage, position, buyPrice) {
  var feePercent;
  var marketFeePercent = parseFloat(tradeCommision.market_commision);

  if (type == "MARKET")
    feePercent = parseFloat(tradeCommision.market_commision);
  else feePercent = parseFloat(tradeCommision.limit_commision);

  var leveragePoint = betPoint * leverage - betPoint;

  var marketFeePoint =
    (parseFloat(betPoint) + parseFloat(leveragePoint)) *
    (marketFeePercent / 100);
  var feePoint =
    (parseFloat(betPoint) + parseFloat(leveragePoint)) * (feePercent / 100);

  var balancePoint = betPoint - feePoint;

  var realTradePoint = balancePoint + leveragePoint;

  var breakPercent = ((balancePoint - marketFeePoint) / realTradePoint) * 98;

  if (ci == "C") {
    // 교차 예상청산가
    var balance = parseFloat(tradeData.mbEstimatedTp) - feePoint;
    breakPercent = ((balance - marketFeePoint) / realTradePoint) * 95;
  }

  var diff = parseFloat(buyPrice * (breakPercent / 100)).toFixed(fixed);

  var breakPrice = Number(buyPrice) - Number(diff);
  if (position === "SHORT") {
    breakPrice = Number(buyPrice) + Number(diff);
  }
  breakPrice = parseFloat(breakPrice).toFixed(fixed);

  // 교차 청산가 조정
  var breakPercentNoLeverage =
    ((betPoint - parseFloat(betPoint) * (marketFeePoint / 100) * 2) /
      betPoint) *
    95;
  if (
    ci == "C" &&
    position === "LONG" &&
    breakPercent > breakPercentNoLeverage
  ) {
    breakPercent = breakPercentNoLeverage;
    diff = parseFloat(buyPrice * (breakPercent / 100)).toFixed(fixed);
    breakPrice = Number(buyPrice) - Number(diff);
  }

  if (parseFloat(breakPrice) < 0) breakPrice = 0;

  return {
    leveragePoint: leveragePoint,
    feePoint: feePoint,
    betPoint: betPoint,
    balancePoint: balancePoint,
    breakPercent: breakPercent,
    breakPrice: breakPrice,
    buyPrice: buyPrice,
    diff: diff,
  };
}

// 주문 확인서 정보 입력 함수
function updateOrderConfirm(orderResult) {
  var orderInfo = tradeData.order;
  var positionStr = "";
  var positionClass = "";

  switch (orderInfo.position) {
    case "LONG":
      positionStr = "매수";
      positionClass = "long";
      break;

    case "SHORT":
      positionStr = "매도";
      positionClass = "short";
      break;
  }

  if (orderInfo.type == "MARKET")
    $(".commision").html(tradeCommision.market_commision);
  else $(".commision").html(tradeCommision.limit_commision);

  $("#position-str")
    .removeClass("long short")
    .addClass(positionClass)
    .html(positionStr);

  //실제 투자 포인트
  $(".real-tp").html(
    parseFloat(orderResult.balancePoint + orderResult.leveragePoint).toFixed(8)
  );

  //진입 가격
  $(".buy-price").html(orderResult.buyPrice);

  //레버리지
  $(".leverage-number").html(orderInfo.leverage);
  $("#leverage-bar").css("left", orderInfo.leverage + "%");
  var orderPoint =
    Number(orderResult.betPoint) + Number(orderResult.leveragePoint);
  $(".leverage-tp").html(parseFloat(orderPoint).toFixed(8));

  //투자 포인트
  $(".bet-tp").html(parseFloat(orderInfo.betPoint).toFixed(8));

  //예상 청산 가격
  var bpriceorig = parseFloat(orderResult.breakPrice).toFixed(fixed);
  $(".break-price").html(bpriceorig);
  var bperorig = parseFloat(orderResult.breakPercent).toFixed(2);
  $(".break-percent").html(bperorig);

  var diffPrice =
    (orderResult.breakPrice * 100 - orderResult.buyPrice * 100) / 100;
  var diffClass = diffPrice > 0 ? "plus" : "minus";

  $("#break-diff").removeClass("plus minus").addClass(diffClass);
}

// 투자하기 버튼 클릭시 validation 체크
function showOrderConfirm() {
  try {
    let nowDataRes = new XMLHttpRequest();
    nowDataRes.open(
      "GET",
      "https://api.binance.com/api/v3/depth?symbol=" +
        (selectCoinInfo ? selectCoinInfo.name + "USDT" : "BTCUSDT") +
        "&limit=1",
      !1
    );
    nowDataRes.send();
    let nowData = JSON.parse(nowDataRes.responseText);
    if (
      !nowData ||
      !nowData.asks ||
      !nowData.asks[0] ||
      !nowData.asks[0][0] ||
      !nowData.bids ||
      !nowData.bids[0] ||
      !nowData.bids[0][0]
    ) {
      return Swal.fire("네트워크 오류!\n새로고침 후 다시 시도해 주세요"), !1;
    } else {
      tradeData.ask = parseFloat(nowData.asks[0][0]).toFixed(fixed);
      tradeData.bid = parseFloat(nowData.bids[0][0]).toFixed(fixed);
    }
  } catch (error) {
    return Swal.fire("네트워크 오류!\n새로고침 후 다시 시도해 주세요"), !1;
  }
  changeOrderInfo();
  window.scrollTo(0, 0);

  var orderInfo = tradeData.order;
  var strMessage = "격리/교차 동시 진입 불가";

  if (tradeData.dataList.length > 0 || tradeLoData.dataList.length > 0) {
    if (tradeLoData.cross == true && orderInfo.ci == "I") {
      Swal.fire(strMessage);
      return false;
    }
    if (tradeLoData.cross == false && orderInfo.ci == "C") {
      Swal.fire(strMessage);
      return false;
    }
  }

  if (!["LONG", "SHORT"].includes(orderInfo.position)) {
    Swal.fire("매수 또는 매도를 선택해 주세요.");
    return false;
  }

  if (orderInfo.betPoint <= 0) {
    Swal.fire("투자금액을 입력해 주세요.");
    return false;
  }

  if (orderInfo.betPoint < 10) {
    Swal.fire("최소 투자금은 10 USDT 입니다.");
    return false;
  }

  if (orderInfo.leverage <= 0) {
    Swal.fire("레버리지를 선택 또는 직접 입력해 주세요.");
    return false;
  }

  if (userSkipOrder == "1") {
    addOrder();
    return;
  }

  $("._layer_background").show();
  $(".layer_order_confirm").show();
}

/* 투자주문서 취소버튼 */
function hideOrderConfirm() {
  $("._layer_background").hide();
  $(".layer_order_confirm").hide();
}

function chkType() {
  var buyPrice = tradeData.orderResult.buyPrice;
  var position = tradeData.order.position;

  if (parseFloat(buyPrice) == parseFloat(tradeData.ask)) {
    tradeData.order.type == "MARKET";
    return;
  }

  if (tradeData.order.type == "LIMITS") {
    if (position == "LONG")
      if (parseFloat(buyPrice) < parseFloat(tradeData.ask))
        tradeData.order.position += "_PLUS";
      else tradeData.order.position += "_MINUS";

    if (position == "SHORT")
      if (parseFloat(buyPrice) < parseFloat(tradeData.bid))
        tradeData.order.position += "_PLUS";
      else tradeData.order.position += "_MINUS";
  }
}

// 투자 등록
function addOrder(element) {
  $("showOrderConfirm").attr("disabled");

  chkType();
  var date = getDate(1);

  var tradeId = getDate(2);
  var realTradePoint =
    tradeData.order.betPoint * tradeData.order.leverage -
    tradeData.orderResult.feePoint;

  tradeData.mbTp = tradeData.realBalancePoint - tradeData.order.betPoint;

  var name;
  var socketUrl;
  var symbol;

  if (selectCoinInfo) {
    name = selectCoinInfo.name;
    symbol = selectCoinInfo.name + "USDT";
    socketUrl = symbol.toLowerCase();
  } else {
    name = "BTC";
    symbol = "BTCUSDT";
    socketUrl = "btcusdt";
  }

  var setData = {
    deleteTrade: false,
    user_id: user_id,
    ci: tradeData.order.ci,
    position: tradeData.order.position,
    type: tradeData.order.type,
    leverage: tradeData.order.leverage,
    betPoint: tradeData.order.betPoint,
    balancePoint: tradeData.orderResult.balancePoint,
    breakPercent: tradeData.orderResult.breakPercent,
    breakPrice: tradeData.orderResult.breakPrice,
    buyPrice: tradeData.orderResult.buyPrice,
    leveragePoint: tradeData.orderResult.leveragePoint,
    date: date,
    realTradePoint: realTradePoint,
    tradeId: tradeId,
    socketUrl: socketUrl,
    socketCheck: false,
    symbol: symbol,
    name: name,
    ask: tradeData.ask,
    bid: tradeData.bid,
  };

  var xhr = new XMLHttpRequest();
  if (tradeData.order.type == "LIMITS") xhr.open("POST", "/OrderLimits.aspx");
  else xhr.open("POST", "/Order.aspx");

  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText == "OK") {
        var position =
          tradeData.order.position.indexOf("LONG") != -1 ? "LONG" : "SHORT";
        var strMsg =
          name +
          " " +
          position +
          " 투자금 " +
          tradeData.order.betPoint +
          " USDT";

        if (tradeData.order.type == "LIMITS") {
          $.toast({
            heading: "지정가 포지션 진입 알림",
            text: strMsg,
            showHideTransition: "fade",
            icon: "error",
            stack: false,
          });
        } else {
          let audio = new Audio("/Sound/add_order.mp3");
          audio.loop = false; // 반복재생하지 않음
          audio.volume = 1; // 음량 설정
          audio.play();
          $.toast({
            heading: "시장가 포지션 진입 알림",
            text: strMsg,
            showHideTransition: "fade",
            icon: "error",
            stack: false,
          });
        }

        betPointReset();

        setTimeout(function () {
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        }, 1200); // 기존 500

        if (element) {
          element.disabled = false;
          element.innerText = "확인";
        }

        orderReset();
        hideOrderConfirm();
      } else if (xhr.responseText.indexOf("MSG|") > -1) {
        Swal.fire(xhr.responseText.split("|")[1]).then(function () {
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        });
      } else {
        Swal.fire("오류가 발생하였습니다 [오류코드:A003]").then(function () {
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        });
      }
    }
  };
  xhr.send(JSON.stringify(setData));
}

function betPointReset() {
  updateRange(0);
  document.getElementById("bet-point").value = 0;
  document.getElementById("Mbet-point").value = 0;
}

// 투자 등록 (tradeLoList -> tradeList)
function addLimitsOrder(tradeLoData) {
  var tradeId = tradeLoData.tradeId;
  tradeData.mbTp = tradeData.realBalancePoint - tradeLoData.betPoint;
  var position = tradeLoData.position;
  var symbol = tradeLoData.symbol;

  // 투자정보를 localStorage에 저장한다.
  var setData = {
    deleteTrade: false,
    user_id: user_id,
    tradeId: tradeId,
    symbol: symbol,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/OrderTrade.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText == "OK") {
        let audio = new Audio("/Sound/add_order.mp3");
        audio.loop = false; // 반복재생하지 않음
        audio.volume = 1; // 음량 설정
        audio.play();

        position = position.indexOf("LONG") != -1 ? "LONG" : "SHORT";
        var strMsg =
          tradeLoData.name +
          " " +
          position +
          " 투자금 " +
          tradeLoData.balancePoint +
          "USDT";
        $.toast({
          heading: "지정가 포지션 진입 알림",
          text: strMsg,
          showHideTransition: "fade",
          icon: "error",
          stack: false,
        });
      } else if (xhr.responseText == "RE") {
        socketBookTicker.close();
      } else if (xhr.responseText.indexOf("MSG|") > -1) {
        alert(xhr.responseText.split("|")[1]);
      } else {
        alert("오류가 발생하였습니다 [오류코드:A004]");
      }

      setTimeout(function () {
        window.location.href = "/Trading.aspx?coinName=" + getCoinName();
      }, 500);
    }
  };
  xhr.send(JSON.stringify(setData));
}

// 손실 청산
function addLiquiationLoss(tradeData) {
  if (reloadTimer) {
    clearInterval(reloadTimer);
  }

  let reloadCnt = 0;
  reloadTimer = setInterval(function () {
    if (isReload || reloadCnt > 20) {
      clearInterval(reloadTimer);

      if (isReload) {
        setTimeout(function () {
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        }, 5000);
      }
    }

    reloadCnt++;
  }, 250);

  var tradeId = tradeData.tradeId;
  var stopType = "loss";

  var setData = {
    tradeId: tradeId,
    stopType: stopType,
    liquidationPriceClient: tradeData.orderResult.buyPrice,
    user_id: user_id,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/LiquidationStop.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        isReload = true;
        if (xhr.responseText == "OK") {
          let audio = new Audio("/Sound/liquidation.mp3");
          audio.loop = false; // 반복재생하지 않음
          audio.volume = 1; // 음량 설정
          audio.play();

          var strMsg =
            tradeData.name +
            " " +
            tradeData.position +
            " 투자금 " +
            tradeData.balancePoint +
            "USDT";
          $.toast({
            heading: "손실 청산 알림",
            text: strMsg,
            showHideTransition: "fade",
            icon: "error",
            stack: false,
          });
          isReload = false;
        } else if (xhr.responseText == "RE") {
          socketBookTicker.close();
        } else if (xhr.responseText.indexOf("MSG|") > -1) {
          alert(xhr.responseText.split("|")[1]);
        } else {
          alert("오류가 발생하였습니다 [오류코드:A005]");
        }
      }
    }
  };
  xhr.send(JSON.stringify(setData));
}

// 수익 청산
function addLiquiationProfit(tradeData) {
  if (reloadTimer) {
    clearInterval(reloadTimer);
  }

  let reloadCnt = 0;
  reloadTimer = setInterval(function () {
    if (isReload || reloadCnt > 20) {
      clearInterval(reloadTimer);
      if (isReload) {
        setTimeout(function () {
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        }, 5000);
      }
    }

    reloadCnt++;
  }, 250);

  var tradeId = tradeData.tradeId;
  var stopType = "profit";

  var setData = {
    tradeId: tradeId,
    stopType: stopType,
    liquidationPriceClient: tradeData.orderResult.buyPrice,
    user_id: user_id,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/LiquidationStop.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        isReload = true;
        if (xhr.responseText == "OK") {
          let audio = new Audio("/Sound/liquidation.mp3");
          audio.loop = false; // 반복재생하지 않음
          audio.volume = 1; // 음량 설정
          audio.play();

          var strMsg =
            tradeData.name +
            " " +
            tradeData.position +
            " 투자금 " +
            tradeData.balancePoint +
            "USDT";
          $.toast({
            heading: "수익 청산 알림",
            text: strMsg,
            showHideTransition: "fade",
            icon: "error",
            stack: false,
          });
          isReload = false;
        } else if (xhr.responseText == "RE") {
          socketBookTicker.close();
        } else if (xhr.responseText.indexOf("MSG|") > -1) {
          alert(xhr.responseText.split("|")[1]);
        } else {
          alert("오류가 발생하였습니다 [오류코드:A006]");
        }
      }
    }
  };
  xhr.send(JSON.stringify(setData));
}

// 투자 정보 리스트
function setDataListInfo() {
  if (tradeData.dataList.length > 0) {
    $("#dataListTbody").html("<tr></tr>");
    $(".no_history").hide();

    for (var i = 0; i < tradeData.dataList.length; i++) {
      var positionClass =
        tradeData.dataList[i].position == "LONG" ? "long" : "short";
      var positionText =
        tradeData.dataList[i].position == "LONG" ? "매수" : "매도";
      var ciText = tradeData.dataList[i].ci == "C" ? "교차" : "격리";

      var content =
        "<tr>" +
        '<td class="cell_price"><a href="/Trading.aspx?coinName=' +
        tradeData.dataList[i].socketUrl +
        '">' +
        tradeData.dataList[i].name +
        "</a></td>" +
        '<td class="cell_price">' +
        '<span class="price">' +
        tradeData.dataList[i].buyPrice +
        "</span>" +
        "<br>" +
        '<span class="date">' +
        tradeData.dataList[i].date +
        "</span></td>" +
        '<td class="cell_price">' +
        '<span id="liq-price-' +
        tradeData.dataList[i].tradeId +
        '" class="price" onclick="stopOrderConfirm(' +
        i +
        ')"></span>';

      if (tradeData.cross == true) {
        if (tradeData.dataList[i].tradeId == tradeData.crossTradeId)
          content +=
            '<button class="btn_submit" type="button" onclick="stopOrderConfirm(\'' +
            i +
            "');\">" +
            parseFloat(tradeData.crossIm).toFixed(2) +
            "</button ></br> ";
        else {
          var maintenanceMargin = parseFloat(
            ((tradeData.dataList[i].betPoint * tradeData.dataList[i].leverage) /
              tradeData.dataList[i].coinMaxLeverage) *
              0.3
          ).toFixed(2);
          content +=
            '<button class="btn_submit" type="button" onclick="stopOrderConfirm(\'' +
            i +
            "');\">" +
            maintenanceMargin +
            "</button ></br> ";
        }
      } else {
        content +=
          '<button class="btn_submit" type="button" onclick="stopOrderConfirm(\'' +
          i +
          "');\">" +
          tradeData.dataList[i].breakPrice +
          "</button ></br> ";
      }
      if (parseFloat(tradeData.dataList[i].profitPrice) != 0)
        content +=
          '<i class="fa fa-exclamation-circle color_red"></i> ' +
          '<button class="btn_submit" type="button" value="profit" onclick="stopOrderConfirm(\'' +
          i +
          "');stopType(this.value)\">" +
          tradeData.dataList[i].profitPrice +
          " (+" +
          tradeData.dataList[i].profitPercent +
          "%)</button ></br> ";
      if (parseFloat(tradeData.dataList[i].stopPrice) != 0)
        content +=
          '<i class="fa fa-exclamation-circle color_blue"></i> ' +
          '<button class="btn_submit" type="button" onclick="stopOrderConfirm(\'' +
          i +
          "');\">" +
          tradeData.dataList[i].stopPrice +
          " (-" +
          tradeData.dataList[i].stopPercent +
          "%)</button > ";

      content +=
        '<td class="cell_type ' +
        positionClass +
        '">' +
        positionText +
        "<br>" +
        ciText +
        "</td>" +
        '<td class="cell_size">' +
        parseFloat(tradeData.dataList[i].balancePoint).toFixed(2) +
        "</td>" +
        '<td class="cell_leverage">' +
        parseFloat(
          tradeData.dataList[i].balancePoint +
            tradeData.dataList[i].leveragePoint
        ).toFixed(2) +
        " (x" +
        tradeData.dataList[i].leverage +
        ")" +
        "</td>" +
        '<td id="rate-point-' +
        tradeData.dataList[i].tradeId +
        '" class="cell_pnl"></td>' +
        '<td id="rate-percent-' +
        tradeData.dataList[i].tradeId +
        '" class="cell_roe"></td>' +
        '<td style="display:none" id="hiden-rate-point-' +
        tradeData.dataList[i].tradeId +
        '"></td>' +
        '<td class="cell_btn">' +
        '<button type="button" data-trade-id="' +
        tradeData.dataList[i].tradeId +
        '" onclick="showLiquidationConfirm(\'' +
        i +
        "');\">청산</button>" +
        "</td></tr>";

      $("#dataListTbody").prepend(content);
    }

    tradeData.totlaBalancePoint = getTotalBalancePoint();
  } else {
    $(".no_history").show();
  }

  localStorage.setItem("localTradeData", JSON.stringify(tradeData));
}

// 지정가 정보 리스트
function setDataLoListInfo() {
  if (tradeLoData.dataList.length > 0) {
    $("#dataLoListTbody").html("<tr></tr>");
    $(".no_lo_history").hide();

    for (var i = 0; i < tradeLoData.dataList.length; i++) {
      var positionClass =
        tradeLoData.dataList[i].position.indexOf("LONG") != -1
          ? "long"
          : "short";
      var positionText =
        tradeLoData.dataList[i].position.indexOf("LONG") != -1
          ? "매수"
          : "매도";
      var ciText = tradeLoData.dataList[i].ci == "C" ? "교차" : "격리";

      if (ciText == "교차") tradeLoData.cross = true;

      var feesPrice =
        parseFloat(tradeLoData.dataList[i].betPoint) -
        parseFloat(tradeLoData.dataList[i].balancePoint);

      var content =
        "<tr>" +
        '<td class="cell_price"><a href="/Trading.aspx?coinName=' +
        tradeLoData.dataList[i].socketUrl +
        '">' +
        tradeLoData.dataList[i].name +
        "</a></td>" +
        '<td class="cell_price">' +
        '<span class="price">' +
        tradeLoData.dataList[i].buyPrice +
        "</span>" +
        '<span class="date">' +
        tradeLoData.dataList[i].date +
        "</span></td>" +
        '<td class="cell_price">' +
        '<span id="now-lo-price-' +
        tradeLoData.dataList[i].tradeId +
        '" class="price"></span>' +
        "</td>";

      content +=
        '<td class="cell_type ' +
        positionClass +
        '">' +
        positionText +
        "<br>" +
        ciText +
        "</td>" +
        '<td class="cell_size">' +
        parseFloat(tradeLoData.dataList[i].balancePoint).toFixed(2) +
        "</td>" +
        '<td class="cell_leverage">' +
        parseFloat(
          tradeLoData.dataList[i].balancePoint +
            tradeLoData.dataList[i].leveragePoint
        ).toFixed(2) +
        " (x" +
        tradeLoData.dataList[i].leverage +
        ")" +
        "</td>" +
        '<td class="cell_feePoint">' +
        parseFloat(feesPrice).toFixed(2) +
        "</td>" +
        '<td class="cell_btn">' +
        '<button type="button" data-trade-id="' +
        tradeLoData.dataList[i].tradeId +
        '" onclick="showLimitsConfirm(\'' +
        i +
        "');\">취소</button>" +
        "</td></tr>";

      $("#dataLoListTbody").prepend(content);
    }
  } else {
    $(".no_lo_history").show();
  }
  localStorage.setItem("localTradeLoData", JSON.stringify(tradeLoData));
}

function stopReset() {
  $("#profit").removeClass("selected");
  $("#loss").addClass("selected");

  $(".stopBar").addClass("selected");
  $(".direct_input").removeClass("selected");

  $("#stopPercent").removeClass("display_red");
  $("#stopPercent").addClass("display_blue");

  $("#stop_type").text("STOP LOSS");
}

// 예상청산가 클릭 시 -> stop loss 설정
function stopOrderConfirm(rowIndex, isNoReset) {
  if (!isNoReset) {
    stopReset();
    scrollTo(0, 0);
  }
  liquidationRowIndex = rowIndex;

  var LastStopPercent;
  let brP = parseFloat(tradeData.dataList[liquidationRowIndex].breakPrice);
  let buP = parseFloat(tradeData.dataList[liquidationRowIndex].buyPrice);
  if (tradeData.dataList[liquidationRowIndex].position == "LONG")
    LastStopPercent = ((brP - buP) / buP) * -100;
  else LastStopPercent = ((buP - brP) / buP) * -100;

  var StopBalancePoint =
    (LastStopPercent / 100) *
    tradeData.dataList[liquidationRowIndex].realTradePoint;
  var realLastStopPercent =
    (StopBalancePoint / tradeData.dataList[liquidationRowIndex].balancePoint) *
    100;

  stopData = {
    type:
      stopData.type == "loss" || stopData.type == "profit"
        ? stopData.type
        : "loss",
    ci: tradeData.dataList[liquidationRowIndex].ci,
    tradeId: tradeData.dataList[liquidationRowIndex].tradeId,
    askPrice: parseFloat(tradeData.dataList[liquidationRowIndex].ask),
    bidPrice: parseFloat(tradeData.dataList[liquidationRowIndex].bid),
    position: tradeData.dataList[liquidationRowIndex].position,
    stopPercent: parseFloat(
      tradeData.dataList[liquidationRowIndex].stopPercent
    ),
    stopPrice: parseFloat(tradeData.dataList[liquidationRowIndex].stopPrice),
    profitPercent: parseFloat(
      tradeData.dataList[liquidationRowIndex].profitPercent
    ),
    profitPrice: parseFloat(
      tradeData.dataList[liquidationRowIndex].profitPrice
    ),
    buyPrice: parseFloat(tradeData.dataList[liquidationRowIndex].buyPrice),
    breakPrice: parseFloat(tradeData.dataList[liquidationRowIndex].breakPrice),
    balancePoint: parseFloat(
      tradeData.dataList[liquidationRowIndex].balancePoint
    ),
    realTradePoint: parseFloat(
      tradeData.dataList[liquidationRowIndex].realTradePoint
    ),
    lastPercent: parseFloat(realLastStopPercent),
  };

  point = [stopData.askPrice, stopData.bidPrice, stopData.buyPrice];
  for (var i = 0; i < point.length; i++) {
    if (i == 0) {
      var decimalPoint = "" + point[i] + ".";
      decimalPoint = decimalPoint.split(".");
      decimalPoint = decimalPoint[1].length;
    }
    var chk = "" + point[i] + ".";
    chk = chk.split(".");
    chk = chk[1].length;
    if (parseInt(decimalPoint) < parseInt(chk)) decimalPoint = chk;
    stopData.fixed = decimalPoint;
  }

  if (stopData.position == "LONG") {
    stopData.nowPrice = stopData.askPrice;
    $(".liquidation-price2").html(stopData.askPrice);
  } else {
    stopData.nowPrice = stopData.bidPrice;
    $(".liquidation-price2").html(stopData.bidPrice);
  }

  $(".coinTitle2").text(tradeData.dataList[liquidationRowIndex].name + "/USDT");
  $(".orderStopCoinTitle").text(
    " " + tradeData.dataList[liquidationRowIndex].name
  );

  if (stopData.ci == "C") {
    var feePercent = parseFloat(tradeCommision.market_commision);
    var betPoint = tradeData.dataList[liquidationRowIndex].betPoint;
    var leverage = tradeData.dataList[liquidationRowIndex].leverage;
    var buyPrice =
      stopData.position == "LONG" ? stopData.askPrice : stopData.bidPrice;
    var leveragePoint = betPoint * leverage - betPoint;
    var feePoint = (betPoint + leveragePoint) * (feePercent / 100);
    var balancePoint = betPoint - feePoint;
    var realTradePoint = balancePoint + leveragePoint;
    var breakPercent = ((balancePoint - feePoint) / realTradePoint) * 98;
    stopData.breakPercent = breakPercent;
    var diff = buyPrice * (breakPercent / 100);
    stopData.breakPrice =
      stopData.position == "LONG" ? buyPrice - diff : buyPrice + diff;
    stopData.breakPrice = stopData.breakPrice.toFixed(stopData.fixed);

    if (tradeData.dataList[liquidationRowIndex].position == "LONG")
      LastStopPercent = ((stopData.breakPrice - buyPrice) / buyPrice) * -100;
    else LastStopPercent = ((buyPrice - stopData.breakPrice) / buyPrice) * -100;

    var StopBalancePoint =
      (LastStopPercent / 100) *
      tradeData.dataList[liquidationRowIndex].realTradePoint;
    var realLastStopPercent =
      (StopBalancePoint /
        tradeData.dataList[liquidationRowIndex].balancePoint) *
      100;
    stopData.lastPercent = realLastStopPercent;
  }

  var nowLossPercent = parseFloat(
    $("#rate-percent-" + stopData.tradeId)
      .html()
      .replace("%", "")
  );

  // 손실 기본 설정
  if (stopData.stopPrice == 0) {
    if (nowLossPercent < -100)
      stopData.stopPercent = (nowLossPercent + -50) * -1;
    else stopData.stopPercent = stopData.lastPercent;

    var lossBalance = (stopData.stopPercent * stopData.balancePoint) / 100;
    var lossPercent = 100 * lossBalance * (1 / stopData.realTradePoint);

    if (stopData.position == "LONG")
      stopData.stopPrice =
        ((lossPercent / 100) * stopData.buyPrice - stopData.buyPrice) * -1;
    else
      stopData.stopPrice =
        stopData.buyPrice - (lossPercent / -100) * stopData.buyPrice;
  }
  // 수익 기본 설정
  if (stopData.profitPrice == 0) {
    if (nowLossPercent > 100) stopData.profitPercent = nowLossPercent + 50;
    else stopData.profitPercent = 100;

    var profitBalance = (stopData.profitPercent * stopData.balancePoint) / 100;
    var profitPercent = 100 * profitBalance * (1 / stopData.realTradePoint);

    if (stopData.position == "LONG")
      stopData.profitPrice =
        stopData.buyPrice - (profitPercent / -100) * stopData.buyPrice;
    else
      stopData.profitPrice =
        ((profitPercent / 100) * stopData.buyPrice - stopData.buyPrice) * -1;
  }

  // 청산가 음수 0 처리 (화면)
  if (stopData.breakPrice < 0) stopData.breakPrice = 0;

  if (stopData.stopPrice < 0) stopData.stopPrice = 0;

  $("#stop-buy-price").text(stopData.buyPrice);
  $("#stopPercent").text(parseFloat(stopData.stopPercent).toFixed(2));
  $("#stopBet").val(stopData.stopPercent);
  $("#stop-point").text(parseFloat(stopData.stopPrice).toFixed(stopData.fixed));

  $("#stop-break-price").text(stopData.breakPrice);

  $("._layer_background").show();
  $(".layer_stoploss_confirm").show();
}

// STOP LOSS  시작
function stopType(type) {
  if (type == "loss") {
    stopData.type = "loss";
    stopTextInput(stopData.stopPercent);
    $("#stop_type").text("STOP LOSS");
    $("#profit").removeClass("selected");
    $("#loss").addClass("selected");
    $("#stopPercent").removeClass("display_red");
    $("#stopPercent").addClass("display_blue");
  } else {
    stopData.type = "profit";
    stopTextInput(stopData.profitPercent);
    $("#stop_type").text("TAKE PROFIT");
    $("#loss").removeClass("selected");
    $("#profit").addClass("selected");
    $("#stopPercent").removeClass("display_blue");
    $("#stopPercent").addClass("display_red");
  }
  $(".stopBar").addClass("selected");
  $(".direct_input").removeClass("selected");
}

function seletePriceType(type) {
  if (type == "direct") {
    $(".stopBar").removeClass("selected");
    $(".direct_input").addClass("selected");

    $("#directView").val($("#stopPercent").text());
  } else {
    percent = $("#directView").val();

    if (stopData.ci == "I") {
      if (stopData.type == "loss") {
        if (parseFloat(percent) > parseFloat(stopData.lastPercent)) {
          alert(
            "현재 진입에 대한 STOP LOSS 설정은 " +
              stopData.lastPercent.toFixed(2) +
              " % 이상 설정 할 수 없습니다."
          );
          stopTextInput(stopData.stopPercent);
          $(".stopBar").addClass("selected");
          $(".direct_input").removeClass("selected");
          return;
        }
      }
    }
    stopTextInput(percent);

    $(".stopBar").addClass("selected");
    $(".direct_input").removeClass("selected");
  }
}

function stopTextInput(val) {
  stopOrderConfirm(liquidationRowIndex, true);

  var outamt = 0;
  if (stopData.ci == "I") {
    if (stopData.type == "loss") {
      if (parseFloat(val) > parseFloat(stopData.lastPercent)) {
        alert(
          "현재 진입에 대한 STOP LOSS 설정은 " +
            stopData.lastPercent.toFixed(2) +
            " % 이상 설정 할 수 없습니다."
        );
        $("#stopBet").val(stopData.stopPercent.toFixed(2));
        $("#stopPercent").text(stopData.stopPercent.toFixed(2));
        $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
        return false;
      }
      var linqBalancePoint = (val * stopData.balancePoint) / 100;
      var linqStopPercent =
        100 * linqBalancePoint * (1 / stopData.realTradePoint);

      if (stopData.position == "LONG") {
        outamt =
          ((linqStopPercent / 100) * stopData.buyPrice - stopData.buyPrice) *
          -1;
        if (parseFloat(outamt) > parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 높게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.stopPercent.toFixed(2));
          $("#stopPercent").text(stopData.stopPercent.toFixed(2));
          $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
          return false;
        }
      } else {
        outamt =
          stopData.buyPrice - (linqStopPercent / -100) * stopData.buyPrice;
        if (parseFloat(outamt) < parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 낮게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.stopPercent.toFixed(2));
          $("#stopPercent").text(stopData.stopPercent.toFixed(2));
          $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
          return false;
        }
      }
      $("#stopBet").val(val);
      $("#stopPercent").text(parseFloat(val).toFixed(2));
      $("#stop-point").text(parseFloat(outamt).toFixed(stopData.fixed));
      return true;
    }

    if ((stopData.type = "profit")) {
      var linqBalancePoint = (val * stopData.balancePoint) / 100;
      var linqProfitPercent =
        100 * linqBalancePoint * (1 / stopData.realTradePoint);

      if (stopData.position == "LONG") {
        outamt =
          stopData.buyPrice - (linqProfitPercent / -100) * stopData.buyPrice;
        if (parseFloat(outamt) < parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 낮게 설정 할 수 없습니다.");

          if (parseFloat(stopData.profitPercent) > 100) $("#stopBet").val(100);
          else $("#stopBet").val(stopData.profitPercent.toFixed(2));

          $("#stopPercent").text(stopData.profitPercent.toFixed(2));
          $("#stop-point").text(stopData.profitPrice.toFixed(stopData.fixed));
          return false;
        }
      } else {
        outamt =
          ((linqProfitPercent / 100) * stopData.buyPrice - stopData.buyPrice) *
          -1;
        if (parseFloat(outamt) > parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 높게 설정 할 수 없습니다.");

          if (parseFloat(stopData.profitPercent) > 100) $("#stopBet").val(100);
          else $("#stopBet").val(stopData.profitPercent.toFixed(2));

          $("#stopPercent").text(stopData.profitPercent.toFixed(2));
          $("#stop-point").text(stopData.profitPrice.toFixed(stopData.fixed));
          return false;
        }
      }

      $("#stopBet").val(val);
      $("#stopPercent").text(parseFloat(val).toFixed(2));
      $("#stop-point").text(parseFloat(outamt).toFixed(stopData.fixed));
      return true;
    }
  }

  if (stopData.ci == "C") {
    if (stopData.type == "loss") {
      if (parseFloat(val) > parseFloat(stopData.lastPercent)) {
        alert(
          "현재 진입에 대한 STOP LOSS 설정은 " +
            stopData.lastPercent.toFixed(2) +
            " % 이상 설정 할 수 없습니다."
        );
        $("#stopBet").val(stopData.stopPercent.toFixed(2));
        $("#stopPercent").text(stopData.stopPercent.toFixed(2));
        $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
        return false;
      }
      var linqBalancePoint = (val * stopData.balancePoint) / 100;
      var linqStopPercent =
        100 * linqBalancePoint * (1 / stopData.realTradePoint);

      if (stopData.position == "LONG") {
        outamt =
          ((linqStopPercent / 100) * stopData.buyPrice - stopData.buyPrice) *
          -1;
        if (parseFloat(outamt) > parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 높게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.stopPercent.toFixed(2));
          $("#stopPercent").text(stopData.stopPercent.toFixed(2));
          $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
          return false;
        }
      } else {
        outamt =
          stopData.buyPrice - (linqStopPercent / -100) * stopData.buyPrice;
        if (parseFloat(outamt) < parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 낮게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.stopPercent.toFixed(2));
          $("#stopPercent").text(stopData.stopPercent.toFixed(2));
          $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
          return false;
        }
      }
    } else {
      var linqBalancePoint = (val * stopData.balancePoint) / 100;
      var linqProfitPercent =
        100 * linqBalancePoint * (1 / stopData.realTradePoint);

      if (stopData.position == "LONG") {
        outamt =
          stopData.buyPrice - (linqProfitPercent / -100) * stopData.buyPrice;
        if (parseFloat(outamt) < parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 낮게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.profitPercent.toFixed(2));
          $("#stopPercent").text(stopData.profitPercent.toFixed(2));
          $("#stop-point").text(stopData.profitPrice.toFixed(stopData.fixed));
          return false;
        }
      } else {
        outamt =
          ((linqProfitPercent / 100) * stopData.buyPrice - stopData.buyPrice) *
          -1;
        if (parseFloat(outamt) > parseFloat(stopData.nowPrice)) {
          alert("현재가 보다 높게 설정 할 수 없습니다.");
          $("#stopBet").val(stopData.profitPercent.toFixed(2));
          $("#stopPercent").text(stopData.profitPercent.toFixed(2));
          $("#stop-point").text(stopData.profitPrice.toFixed(stopData.fixed));
          return false;
        }
      }
    }
    $("#stopBet").val(val);
    $("#stopPercent").text(parseFloat(val).toFixed(2));
    $("#stop-point").text(parseFloat(outamt).toFixed(stopData.fixed));
    return true;
  }
}

function selectTradingList(ele) {
  $(".history-btn").removeClass("selected");
  $(ele).addClass("selected");
}

// stop Loss 등록
function addStopOrder() {
  let perVal = parseFloat($("#stopPercent").html());
  if (perVal <= 0) {
    if (stopData.type == "loss") {
      $("#stopBet").val(stopData.stopPercent.toFixed(2));
      $("#stopPercent").text(stopData.stopPercent.toFixed(2));
      $("#stop-point").text(stopData.stopPrice.toFixed(stopData.fixed));
    } else {
      $("#stopBet").val(stopData.profitPercent.toFixed(2));
      $("#stopPercent").text(stopData.profitPercent.toFixed(2));
      $("#stop-point").text(stopData.profitPrice.toFixed(stopData.fixed));
    }

    setTimeout(function () {
      $("#btnStoploss").text("확인");
      $("#btnStoploss").attr("disabled", false);
    }, 300);
    alert("마이너스로 설정 할 수 없습니다.");
    return;
  }
  var isAddStopOrder = stopTextInput(perVal);

  if (!isAddStopOrder) {
    setTimeout(function () {
      $("#btnStoploss").text("확인");
      $("#btnStoploss").attr("disabled", false);
    }, 300);
    return;
  }

  stopData.stopPercent = $("#stopPercent").html();
  stopData.stopPrice = $("#stop-point").html();

  stopData.profitPercent = $("#stopPercent").html();
  stopData.profitPrice = $("#stop-point").html();

  var setData = {
    stopType: stopData.type,
    user_id: user_id,
    tradeId: stopData.tradeId,
    stopPercent: stopData.stopPercent,
    stopPrice: stopData.stopPrice,
    profitPercent: stopData.profitPercent,
    profitPrice: stopData.profitPrice,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/StopOrder.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText == "OK") {
      } else if (xhr.responseText.indexOf("MSG|") > -1) {
        alert(xhr.responseText.split("|")[1]);
      } else {
        alert("오류가 발생하였습니다 [오류코드:S001]");
      }
      window.location.href = "/Trading.aspx?coinName=" + getCoinName();
    }
  };
  xhr.send(JSON.stringify(setData));
}

// STOP LOSS 취소 버튼
function hideStopOrderConfirm() {
  $("#stop_comment").removeClass("selected");
  $("._layer_background").hide();
  $(".layer_stoploss_confirm").hide();
}

// stop Loss 삭제 (초기화)
function addStopReset() {
  var setData = {
    stopType: stopData.type,
    user_id: user_id,
    tradeId: stopData.tradeId,
    stopPercent: 0,
    stopPrice: 0,
    profitPercent: 0,
    profitPrice: 0,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/StopOrder.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText == "OK") {
      } else if (xhr.responseText.indexOf("MSG|") > -1) {
        alert(xhr.responseText.split("|")[1]);
      } else {
        alert("오류가 발생하였습니다 [오류코드:S002]");
      }
      window.location.href = "/Trading.aspx?coinName=" + getCoinName();
    }
  };
  xhr.send(JSON.stringify(setData));

  $("._stop_background").hide();
  $(".stop_order_confirm").hide();
}

// 지정가 삭제
function deleteTradeLo(element) {
  element.disabled = true;

  var tradeId = tradeLoData.dataList[limitsRowIndex].tradeId;
  var betPoint = tradeLoData.dataList[limitsRowIndex].betPoint;

  var setData = {
    deleteTrade: true,
    user_id: user_id,
    tradeId: tradeId,
    betPoint: betPoint,
  };

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/OrderLimits.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.responseText == "OK") {
      } else if (xhr.responseText.indexOf("MSG|") > -1) {
        alert(xhr.responseText.split("|")[1]);

        $("._layer_background").hide();
        $(".layer_limits_confirm").hide();
      } else {
        alert("오류가 발생하였습니다 [오류코드:L001]");

        $("._layer_background").hide();
        $(".layer_limits_confirm").hide();
      }
      window.location.href = "/Trading.aspx?coinName=" + getCoinName();
    }
  };
  xhr.send(JSON.stringify(setData));
}

// 수익률 계산
function setRender() {
  const start = Date.now();
  if (setRenderTimer) {
    clearInterval(setRenderTimer);
    setRenderTimer = null;
  }

  setRenderTimer = setInterval(function () {
    let du = (Date.now() - start) / 1000;
    if (du > 60) {
      clearInterval(setRenderTimer);
      setRenderTimer = null;
      setRender();
      return;
    }
    var sumTp = 0;
    var sumBetPoint = 0;
    var dataListLength = tradeData.dataList.length;
    var allSocketConnect = true;

    if (dataListLength > 0) {
      for (var i = 0; i < dataListLength; i++) {
        sumBetPoint = sumBetPoint + tradeData.dataList[i].betPoint;

        if (tradeData.dataList[i].socketCheck != true) {
          console.log(
            "************************* 소켓연결 확인 *************************"
          );
          allSocketConnect = false;
          continue;
        }

        var liqPrice = 0;
        var liqPriceId = "";
        var ratePercent = 0;
        var leverageRatePercent = 0;
        var ratePoint = 0;
        var perCentId = "";
        var perCentClass = "";
        var ratePointId = "";
        var hidenRatePoint = 0;

        crossType = tradeData.dataList[i].ci;

        if (tradeData.dataList[i].position == "LONG") {
          liqPrice = tradeData.dataList[i].ask;
          ratePercent =
            ((tradeData.dataList[i].ask - tradeData.dataList[i].buyPrice) /
              tradeData.dataList[i].buyPrice) *
            100;
        } else {
          liqPrice = tradeData.dataList[i].bid;
          ratePercent =
            ((tradeData.dataList[i].buyPrice - tradeData.dataList[i].bid) /
              tradeData.dataList[i].buyPrice) *
            100;
        }

        tradeData.dataList[i].ratePercent = ratePercent;
        tradeData.dataList[i].ratePoint =
          (ratePercent / 100) * tradeData.dataList[i].realTradePoint;

        ratePoint = (ratePercent / 100) * tradeData.dataList[i].realTradePoint;
        leverageRatePercent =
          (ratePoint / tradeData.dataList[i].balancePoint) * 100;
        liqPriceId = "#liq-price-" + tradeData.dataList[i].tradeId;
        perCentId = "#rate-percent-" + tradeData.dataList[i].tradeId;
        perCentClass =
          ratePercent > 0 ? "plus" : ratePercent < 0 ? "minus" : "";
        ratePointId = "#rate-point-" + tradeData.dataList[i].tradeId;

        hidenRatePoint = ratePoint;

        // 손실
        var LiqStop = false;
        var stopPrice = tradeData.dataList[i].stopPrice;

        if (parseFloat(stopPrice) > 0) {
          if (tradeData.dataList[i].position == "LONG") {
            if (parseFloat(liqPrice) <= parseFloat(stopPrice)) LiqStop = true;
          } else if (tradeData.dataList[i].position == "SHORT") {
            if (parseFloat(liqPrice) >= parseFloat(stopPrice)) LiqStop = true;
          }
          if (LiqStop == true && !tradeData.dataList[i].isLiqRun) {
            clearInterval(setRenderTimer);
            tradeData.dataList[i].isLiqRun = true;
            addLiquiationLoss(tradeData.dataList[i]);
            break;
          }
        }

        // 수익
        var LiqProfit = false;
        var profitPrice = tradeData.dataList[i].profitPrice;

        if (parseFloat(profitPrice) > 0) {
          if (tradeData.dataList[i].position == "LONG") {
            if (parseFloat(liqPrice) >= parseFloat(profitPrice))
              LiqProfit = true;
          } else if (tradeData.dataList[i].position == "SHORT") {
            if (parseFloat(liqPrice) <= parseFloat(profitPrice))
              LiqProfit = true;
          }
          if (LiqProfit == true && !tradeData.dataList[i].isLiqRun) {
            clearInterval(setRenderTimer);
            tradeData.dataList[i].isLiqRun = true;
            addLiquiationProfit(tradeData.dataList[i]);
            break;
          }
        }

        //CHANGES
        $("#hiden-rate-point-" + tradeData.dataList[i].tradeId).html(
          parseFloat(hidenRatePoint).toFixed(2)
        );

        sumTp = sumTp + ratePoint;

        ratePoint = parseFloat(ratePoint).toFixed(2);

        if (perCentClass == "minus") {
          ratePoint = ratePoint * -1;
          ratePoint = "-" + ratePoint;
          leverageRatePercent =
            parseFloat(leverageRatePercent).toFixed(2) + "%";
        } else if (perCentClass == "plus") {
          ratePoint = ratePoint * 1;
          ratePoint = "+" + ratePoint;
          leverageRatePercent =
            parseFloat(leverageRatePercent).toFixed(2) + "%";
        } else {
          ratePoint = 0;
          leverageRatePercent = "0%";
        }
        $(liqPriceId)
          .removeClass("plus minus")
          .addClass(perCentClass)
          .html(liqPrice + " (" + parseFloat(ratePercent).toFixed(2) + "%)");
        $(ratePointId)
          .removeClass("plus minus")
          .addClass(perCentClass)
          .html(ratePoint);
        $(perCentId)
          .removeClass("plus minus")
          .addClass(perCentClass)
          .html(leverageRatePercent);

        // 청산 레이어 팝업 계산
        if (liquidationRowIndex > -1 && liquidationRowIndex == i) {
          if (tradeData.dataList[i].position == "LONG") {
            $(".liquidation-price2").html(tradeData.dataList[i].ask);
          } else {
            $(".liquidation-price2").html(tradeData.dataList[i].bid);
          }

          $(".liq-bet-tp2").html(
            parseFloat(
              tradeData.dataList[i].balancePoint * (liquidationPercent / 100)
            ).toFixed(8)
          );
          $(".liq-leverage-tp2").html(
            parseFloat(
              tradeData.dataList[i].leveragePoint * (liquidationPercent / 100)
            ).toFixed(8)
          );
          $("#rate-percent2")
            .removeClass("plus minus")
            .addClass(perCentClass)
            .html(leverageRatePercent);
          $("#rate-price2")
            .removeClass("plus minus")
            .addClass(perCentClass)
            .html(
              parseFloat(
                getOnlyNumber(ratePoint) * (liquidationPercent / 100)
              ) + " USDT"
            );
        }
      }

      /** 전체 수익률, 전체 수익TP 계산 START **/
      var sumRateClass = "";
      var sumRatePoint = 0;
      var sumRate = 0;

      if (sumTp != 0) {
        sumRatePoint = parseFloat(sumTp);
        sumRatePoint = Number(sumRatePoint);
      }
      if (parseFloat(tradeData.totlaBalancePoint) == 0) return;

      sumRate =
        (parseFloat(sumTp) / parseFloat(tradeData.totlaBalancePoint)) * 100;

      sumRate = parseFloat(sumRate).toFixed(2);
      sumRatePoint = parseFloat(sumRatePoint).toFixed(2);

      if (sumTp > 0) {
        sumRateClass = "plus";
        sumRatePoint = "+" + sumRatePoint;
        sumRate = "+" + sumRate;
      } else if (sumTp < 0) {
        sumRateClass = "minus";
      }

      if (!isFinite(sumRate)) return;

      var valp1 = tradeData.realBalancePoint;
      var valp2 = tradeData.totlaBalancePoint;
      var valp3 = Number(sumRatePoint.toString().replace(/,/g, ""));
      var valp4 = valp2 * parseFloat(tradeCommision.market_commision);

      tradeData.mbEstimatedTp = (valp1 + valp2 + valp3 - valp4).toFixed(2);
      $(".mb-estimated-tp").html(tradeData.mbEstimatedTp);

      if (tradeData.cross) {
        tradeData.mbTp = tradeData.memberBalancePoint + valp3;
        if (tradeData.mbTp < 0) tradeData.mbTp = 0;
        // $(".mb-tp").html(tradeData.mbTp.toFixed(2) + " USDT");
        $(".mb-tp").html(tradeData.realBalancePoint.toFixed(2) + " USDT");
        $(".totlaBalancePoint").html(sumBetPoint.toFixed(2));
      } else {
        $(".totlaBalancePoint").text(tradeData.totlaBalancePoint.toFixed(2));
      }
      $("#sum-settle-tp")
        .removeClass("plus minus")
        .addClass(sumRateClass)
        .html(sumRatePoint + "");
      $("#sum-settle-rate")
        .removeClass("plus minus")
        .addClass(sumRateClass)
        .html(sumRate + "%");

      if (tradeData.cross) {
        if (allSocketConnect) {
          checkCrossDataList(tradeData.dataList);
        }
      } else {
        checkDataList(tradeData.dataList);
      }
    } else {
      $(".mb-estimated-tp").html("0");
      $(".totlaBalancePoint").html("0");
      $(".no_history").show();
    }
  }, 200);
}

function setRenderLo() {
  const start = Date.now();
  if (setRenderLoTimer) {
    clearInterval(setRenderLoTimer);
    setRenderLoTimer = null;
  }
  setRenderLoTimer = setInterval(function () {
    let du = (Date.now() - start) / 1000;
    if (du > 60) {
      clearInterval(setRenderLoTimer);
      setRenderLoTimer = null;
      setRenderLo();
      return;
    }

    var dataListLength = tradeLoData.dataList.length;

    if (dataListLength > 0) {
      for (var i = 0; i < dataListLength; i++) {
        if (tradeLoData.dataList[i].socketCheck != true) {
          console.log(
            "************************* 소켓연결 확인 *************************"
          );
          continue;
        }

        tradeId = tradeLoData.dataList[i].tradeId;

        var limitsPosition = tradeLoData.dataList[i].position;
        var position =
          tradeLoData.dataList[i].position.indexOf("LONG") != -1
            ? "long"
            : "short";
        var nowPrice =
          position == "long"
            ? tradeLoData.dataList[i].ask
            : tradeLoData.dataList[i].bid;
        var buyPrice = tradeLoData.dataList[i].buyPrice;
        var nowPriceId = "#now-lo-price-" + tradeId;
        $(nowPriceId).html(nowPrice);

        if (limitsPosition == "LONG_PLUS") {
          if (parseFloat(nowPrice) <= parseFloat(buyPrice)) {
            clearInterval(setRenderLoTimer);
            addLimitsOrder(tradeLoData.dataList[i]);
            tradeLoData.dataList.splice(i, 1);
            break;
          }
        }
        if (limitsPosition == "LONG_MINUS") {
          if (parseFloat(nowPrice) >= parseFloat(buyPrice)) {
            clearInterval(setRenderLoTimer);
            addLimitsOrder(tradeLoData.dataList[i]);
            tradeLoData.dataList.splice(i, 1);
            break;
          }
        }
        if (limitsPosition == "SHORT_PLUS") {
          if (parseFloat(nowPrice) <= parseFloat(buyPrice)) {
            clearInterval(setRenderLoTimer);
            addLimitsOrder(tradeLoData.dataList[i]);
            tradeLoData.dataList.splice(i, 1);
            break;
          }
        }
        if (limitsPosition == "SHORT_MINUS") {
          if (parseFloat(nowPrice) >= parseFloat(buyPrice)) {
            clearInterval(setRenderLoTimer);
            addLimitsOrder(tradeLoData.dataList[i]);
            tradeLoData.dataList.splice(i, 1);
            break;
          }
        }
      }
    } else {
      $(".no_lo_history").show();
    }
  }, 200);
}

// 청산 버튼 클릭시
function showLiquidationConfirm(rowIndex) {
  window.scrollTo(0, 0);

  liquidationRowIndex = rowIndex;
  liquidationPercent = 100;

  var positionClass =
    tradeData.dataList[liquidationRowIndex].position == "LONG"
      ? "long"
      : "short";
  var positionText =
    tradeData.dataList[liquidationRowIndex].position == "LONG"
      ? "매수"
      : "매도";

  $(".coinTitle2").text(tradeData.dataList[liquidationRowIndex].name + "/USDT");
  $(".coinPosition2").text(positionText);
  $(".coinPosition2").removeClass("long short").addClass(positionClass);
  $(".orderCoinTitle2").text(
    " " + tradeData.dataList[liquidationRowIndex].name
  );

  // 투자금
  $(".bet-tp2").html(tradeData.dataList[liquidationRowIndex].balancePoint);

  //진입 가격
  $(".buy-price2").html(tradeData.dataList[liquidationRowIndex].buyPrice);

  //레버리지
  $(".leverage-number2").html(tradeData.dataList[liquidationRowIndex].leverage);
  $(".leverage-tp2").html(
    tradeData.dataList[liquidationRowIndex].leveragePoint
  );

  $("#liquidationButton").attr(
    "data-tradeid",
    tradeData.dataList[liquidationRowIndex].tradeId
  );

  $("._layer_background").show();
  $(".layer_liquidation_confirm").show();
}

// 청산 취소버튼
function hideLiquidationConfirm() {
  liquidationRowIndex = -1;

  $("._layer_background").hide();
  $(".layer_liquidation_confirm").hide();
}

// 지정가 취소 버튼
function hideLimitsConfirm() {
  limitsRowIndex = -1;

  $("._layer_background").hide();
  $(".layer_limits_confirm").hide();
}

// 청산 처리 (강제청산 및 유저청산)
function liquidationOrder(tradeId, forceLiquidation) {
  var liquidationPercent2 = forceLiquidation == true ? 100 : liquidationPercent;
  var setData = {
    tradeId: tradeId,
    liquidationPercent: liquidationPercent2,
    force: forceLiquidation,
    liquidationPrice: tradeData.orderResult.buyPrice,
    user_id: user_id,
  };
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/Liquidation.aspx");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
    if (forceLiquidation == true) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (xhr.responseText == "OK") {
          let audio = new Audio("/Sound/liquidation_force.mp3");
          audio.loop = false; // 반복재생하지 않음
          audio.volume = 1; // 음량 설정
          audio.play();

          setTimeout(function () {
            window.location.href = "/Trading.aspx?coinName=" + getCoinName();
          }, 1500); // 기존 300
        } else if (xhr.responseText == "RE") {
          socketBookTicker.close();
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        } else {
          Swal.fire("오류가 발생하였습니다. 코드:A001");
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        }
      }
    } else {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (xhr.responseText == "OK") {
          let audio = new Audio("/Sound/liquidation.mp3");
          audio.loop = false; // 반복재생하지 않음
          audio.volume = 1; // 음량 설정
          audio.play();

          setTimeout(function () {
            window.location.href = "/Trading.aspx?coinName=" + getCoinName();
          }, 1200); // 기존 300
        } else if (xhr.responseText == "RE") {
          socketBookTicker.close();
        } else {
          liq_suspend = false;
          Swal.fire("오류가 발생하였습니다. 코드:A002");
          window.location.href = "/Trading.aspx?coinName=" + getCoinName();
        }
      }
    }
  };
  xhr.send(JSON.stringify(setData));
}

// 지정가(취소) 버튼 클릭시
function showLimitsConfirm(rowIndex) {
  window.scrollTo(0, 0);

  limitsRowIndex = rowIndex;

  var positionClass =
    tradeLoData.dataList[limitsRowIndex].position == "LONG" ? "long" : "short";
  var positionText =
    tradeLoData.dataList[limitsRowIndex].position == "LONG" ? "매수" : "매도";

  $(".coinTitle2").text(tradeLoData.dataList[limitsRowIndex].name + "/USDT");
  $(".coinPosition2").text(positionText);
  $(".coinPosition2").removeClass("long short").addClass(positionClass);
  $(".orderCoinTitle2").text(" " + tradeLoData.dataList[limitsRowIndex].name);

  // 투자금
  $(".bet-tp2").html(tradeLoData.dataList[limitsRowIndex].betPoint.toFixed(2));

  //진입 가격
  $(".buy-price2").html(tradeLoData.dataList[limitsRowIndex].buyPrice);

  //레버리지
  $(".leverage-number2").html(tradeLoData.dataList[limitsRowIndex].leverage);
  $(".leverage-tp2").html(tradeLoData.dataList[limitsRowIndex].leveragePoint);

  //현재가
  let nowPrice = document.getElementsByClassName("now-lo-price")[0];
  nowPrice.id = "now-lo-price-" + tradeLoData.dataList[limitsRowIndex].tradeId;

  $("#limitsButton").attr(
    "data-tradeid",
    tradeLoData.dataList[limitsRowIndex].tradeId
  );

  $("._layer_background").show();
  $(".layer_limits_confirm").show();
}

//예산청산가 및 수익률이 -100% 일때 정산되는 함수//
function checkDataList(dataList) {
  if (liq_suspend) return;

  var investList = [];
  var cnt = 0;

  if (dataList.length > 0) {
    for (var i = 0; i < dataList.length; i++) {
      if (dataList[i].socketCheck == false) return;

      if (dataList[i].ci == "I") {
        var stopPrice = Number(dataList[i].stopPrice);
        if (parseFloat(stopPrice) > 0) {
          investList.push(dataList[i]);
        } else {
          var liquidationPrice = Number(dataList[i].breakPrice);

          if (dataList[i].position == "LONG" && dataList[i].ask != null) {
            if (Number(dataList[i].ask) <= Number(liquidationPrice)) {
              console.log("레버리지 L 강제청산 " + i);

              liquidationOrder(dataList[i].tradeId, true);
            } else {
              investList.push(dataList[i]);
            }
          } else if (
            dataList[i].position == "SHORT" &&
            dataList[i].bid != null
          ) {
            if (Number(dataList[i].bid) >= Number(liquidationPrice)) {
              console.log("레버리지 S 강제청산 " + i);
              liquidationOrder(dataList[i].tradeId, true);
            } else {
              investList.push(dataList[i]);
            }
          }
        }
      }
    }

    if (dataList.length != investList.length) {
      tradeData.mbTp = getBalancePoint();
      tradeData.totlaBalancePoint = getTotalBalancePoint();
      tradeData.dataList = investList;

      $(".mb-tp").text(
        parseFloat(tradeData.realBalancePoint).toFixed(2) + " USDT"
      );
      $(".totlaBalancePoint").text(tradeData.totlaBalancePoint);

      localStorage.setItem("localTradeData", JSON.stringify(tradeData));
    }

    if (dataList.length > 0 && dataList.length == cnt) {
      $("#sum-settle-tp").removeClass("plus minus").html("-");
      $("#sum-settle-rate").removeClass("plus minus").html("-");
    }
  }
}

function checkCrossDataList(dataList) {
  if (liq_suspend) return;

  var investList = [];
  var cnt = 0;

  if (dataList.length > 0) {
    for (var i = 0; i < dataList.length; i++) {
      if (dataList[i].socketCheck == false) return;

      if (
        liq_suspend == false &&
        Number(tradeData.mbEstimatedTp) != 0 &&
        dataList[i].tradeId == tradeData.crossTradeId &&
        Number(tradeData.mbEstimatedTp) < Number(tradeData.crossIm)
      ) {
        console.log("교차 강제 청산 " + i);
        liq_suspend = true;
        liquidationOrder(dataList[i].tradeId, true);
      } else {
        investList.push(dataList[i]);
      }
    }

    if (dataList.length != investList.length) {
      console.log("스토리지 정보 갱신 ==========================");
      tradeData.mbTp = getBalancePoint();
      tradeData.totlaBalancePoint = getTotalBalancePoint();
      tradeData.dataList = investList;

      $(".mb-tp").text(
        parseFloat(tradeData.realBalancePoint).toFixed(2) + " USDT"
      );
      $(".totlaBalancePoint").text(tradeData.totlaBalancePoint);

      localStorage.setItem("localTradeData", JSON.stringify(tradeData));
    }

    if (dataList.length > 0 && dataList.length == cnt) {
      $("#sum-settle-tp").removeClass("plus minus").html("-");
      $("#sum-settle-rate").removeClass("plus minus").html("-");
    }
  }
}

// 회원잔고 가져오기
function getBalancePoint() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/BalanceCheck.aspx?div=balance", false);
  xhr.send();
  return Number(xhr.responseText);
}

// 거래내역 총 balancePoint
function getTotalBalancePoint() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/BalanceCheck.aspx?div=totalbalance", false);
  xhr.send();
  return Number(xhr.responseText);
}

// 교차 청산대상 가져오기
function getCrossInfo() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/CrossInfo.aspx", false);
  xhr.send();
  return xhr.responseText;
}

$(function () {
  var currentMode = localStorage.getItem("currentMode");
  var symbol = "binance:" + getCoinName();

  if (currentMode == null) {
    tradingLightView(symbol);
  } else {
    tradingDarkView(symbol);
  }

  if (window.location.search) {
    if (selectCoinInfo) {
      $(".coinTitle").text(
        selectCoinInfo.nameKr + "(" + selectCoinInfo.name + "/USDT)"
      );
      $(".orderCoinTitle").text(" " + selectCoinInfo.name);
      fixed = selectCoinInfo.fixed;
      fixed2 = selectCoinInfo.fixed2;
    }

    var searchParams = new URLSearchParams(window.location.search);
    var name = searchParams.get("coinName");
    Websocketinit(name);
  } else {
    $(".coinTitle").text("비트코인(BTC/USDT)");

    Websocketinit("btcusdt");
  }
});

var socket;
var socket2;
var coinName; //코인변경 저장 변수
var peprice; //이전 가격 저장 변수
var asksArray = []; //이전 매도(숏) 수량 저장 변수
var bidsArray = []; //이전 매수(롱) 수량 저장 변수

function Websocketinit(coinName) {
  socket = new WebSocket(
    " wss://stream.binance.com:9443/ws/" + coinName + "@trade"
  );
  socket2 = new WebSocket(
    " wss://stream.binance.com:9443/ws/" + coinName + "@depth10@100ms"
  );

  socket.onopen = function (event) {
    socketOpen(event);
  };
  socket.onmessage = function (event) {
    socketMessage(event);
  };
  socket.onclose = function (event) {
    socketClose(event);
  };

  socket2.onopen = function (event) {
    socketOpen(event);
  };
  socket2.onmessage = function (event) {
    socketMessage2(event);
  };
}

function socketOpen(event) {
  console.log("연결 완료 socket");
}

function socketClose(event) {
  Websocketinit(coinName);
}

//웹소켓 종료
function disconnect() {
  socket.close();
  socket2.close();
  console.log("연결 종료 socket");
}

// 최근거래내역 Web Socket 통신 전달 메시지 받는 함수
var tradelistLastUpdateTime = new Date();
var tradelistCount = 0;
function socketMessage(event) {
  var data = JSON.parse(event.data);

  var price = parseFloat(data.p).toFixed(fixed); // 가격 소수점
  var volume = parseFloat(data.q).toFixed(fixed2); // 수량 소수점
  var date = new Date(data.T); // 타임스태프 한국시간으로 표시
  var time =
    date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds(); // 한국시간 12:10:22 시분초로 표시

  if (tradelistCount < 20 || date - tradelistLastUpdateTime < 100) {
    if (tradelistCount < 20) tradelistCount++;
    if (tradelistCount == 20) return;
  }
  tradelistLastUpdateTime = date;

  //if는 최근거래내역중 매도 내역, else는 최근거래내역중 매수 내역
  if (data.m) {
    var content =
      '<li class="sell">' +
      '<span class="price">' +
      price +
      "</span>" +
      '<span class="volume">' +
      volume +
      "</span>" +
      '<span class="time">' +
      time +
      "</span>" +
      '<span class="type"><em>S</em></span>';
  } else {
    var content =
      '<li class="buy">' +
      '<span class="price">' +
      price +
      "</span>" +
      '<span class="volume">' +
      volume +
      "</span>" +
      '<span class="time">' +
      time +
      "</span>" +
      '<span class="type"><em>B</em></span>';
  }

  $("#recent-ul").prepend(content);

  var lisize = $("#recent-ul").children().length;

  if (lisize == 18) {
    $("#recent-ul li").last().remove();
  } else {
    $(".loadingDiv").css("display", "none");
    $(".transaction_area > .recent > ul").css("display", "table");
    $("#order-book-current-price").css("visibility", "visible");
  }

  if (peprice * 1 < price) {
    $("#order-book-current-price").removeClass("sell");
    $("#order-book-current-price").addClass("buy");
    $(".current-price").text(price);
    $(".current-price-mark").text("▲");
  } else if (peprice * 1 > price) {
    $("#order-book-current-price").removeClass("buy");
    $("#order-book-current-price").addClass("sell");
    $(".current-price").text(price);
    $(".current-price-mark").text("▼");
  } else {
    $("#order-book-current-price").removeClass("buy");
    $("#order-book-current-price").removeClass("sell");
    $(".current-price").text(price);
    $(".current-price-mark").text("　");
  }

  peprice = price;
}

// 주문장 Web Socket 통신 전달 메시지 받는 함수
var oblistLastUpdateTime = new Date();
function socketMessage2(event) {
  // 바이낸스 API로 depth 데이터를 JSON 형태로 변환 (주문장)
  var data = JSON.parse(event.data);
  var asks = "";
  var bids = "";
  var date = new Date(); // 타임스태프 한국시간으로 표시

  if (date - oblistLastUpdateTime < 100) {
    return;
  }
  oblistLastUpdateTime = date;

  $("#asks-ul li").remove();
  $("#bids-ul li").remove();

  tradeData.ask = parseFloat(data.asks[0][0]).toFixed(fixed);
  tradeData.bid = parseFloat(data.bids[0][0]).toFixed(fixed);
  changeOrderInfo(); // 모의투자 시장가 셋팅함수

  for (var i = 6; i >= 0; i--) {
    var asksPrice = parseFloat(data.asks[i][0]).toFixed(fixed); // 매도(숏) 가격
    var asksVoume = parseFloat(data.asks[i][1]).toFixed(fixed2); // 매도(숏) 수량
    var total = (
      parseFloat(data.asks[i][0]).toFixed(fixed) *
      parseFloat(data.asks[i][1]).toFixed(fixed2)
    ).toFixed(fixed2); // 매도(숏) 총액

    var asksTotal = total; // 매도(숏) 총액 , 정규식 처리
    var asksPer = ((100 / asksPrice) * total).toFixed(); // 프로그레스 퍼센트 계산

    var bidsPrice = parseFloat(data.bids[6 - i][0]).toFixed(fixed); // 매수(롱) 가격
    var bidsVoume = parseFloat(data.bids[6 - i][1]).toFixed(fixed2); // 매수(롱) 수량
    var total2 = (
      parseFloat(data.bids[6 - i][0]).toFixed(fixed) *
      parseFloat(data.bids[6 - i][1]).toFixed(fixed2)
    ).toFixed(fixed2); // 매수(롱) 총액

    var bidsTotal = total2; // 매수(롱) 총액 콤마 정규식 처리
    var bidsPer = ((100 / bidsPrice) * total2).toFixed(); // 프로그레스 퍼센트 계산

    var asksVolClass = '<p class="volume order-book-size">';
    var bidsVolClass = '<p class="volume order-book-size">';

    if (asksArray.length > 0) {
      var preasksVoume = parseFloat(asksArray[i][1]).toFixed(fixed2);

      if (preasksVoume * 1 < asksVoume * 1) {
        asksVolClass = '<p class="volume order-book-size volume-size-up">';
      } else if (preasksVoume * 1 > asksVoume * 1) {
        asksVolClass = '<p class="volume order-book-size volume-size-down">';
      } else {
        asksVolClass = '<p class="volume order-book-size">';
      }
    }

    if (bidsArray.length > 0) {
      var preBidsVoume = parseFloat(bidsArray[6 - i][1]).toFixed(fixed2);

      if (preBidsVoume * 1 < bidsVoume * 1) {
        bidsVolClass = '<p class="volume order-book-size volume-size-up">';
      } else if (preBidsVoume * 1 > bidsVoume * 1) {
        bidsVolClass = '<p class="volume order-book-size volume-size-down">';
      } else {
        bidsVolClass = '<p class="volume order-book-size">';
      }
    }

    if (asksPer > 100) {
      asksPer = 100;
    }

    if (bidsPer > 100) {
      bidsPer = 100;
    }

    asks +=
      '<li onmousedown="selectType(' +
      asksPrice +
      ');"><p class="price">' +
      asksPrice +
      "</p>" +
      asksVolClass +
      asksVoume +
      "</p>" +
      '<p class="total"><span class="inner" style="width:' +
      asksPer +
      '%;"><em class="num">' +
      asksTotal +
      "</em></span></li>";

    bids +=
      '<li onmousedown="selectType(' +
      bidsPrice +
      ');"><p class="price">' +
      bidsPrice +
      "</p>" +
      bidsVolClass +
      bidsVoume +
      "</p>" +
      '<p class="total"><span class="inner" style="width:' +
      bidsPer +
      '%;"><em class="num">' +
      bidsTotal +
      "</em></span></li>";
  }

  $(".order_book .top").css("display", "table");

  asksArray = data.asks;
  bidsArray = data.bids;

  $("#asks-ul").append(asks);
  $("#bids-ul").append(bids);
}

/* dark Mode */
function tradingLightView(symbol) {
  new TradingView.widget({
    width: 837,
    height: 600,
    symbol: symbol,
    interval: "1",
    timezone: "Asia/Seoul",
    theme: "light",
    style: "1",
    locale: "kr",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    hide_top_toolbar: false,
    container_id: "tradingview_fd5a7",
    hide_side_toolbar: false,
    hidevolume: true,
    overrides: {
      "mainSeriesProperties.style": 1,
      "mainSeriesProperties.candleStyle.upColor": "#e14549",
      "mainSeriesProperties.candleStyle.downColor": "#3498db",
      "mainSeriesProperties.candleStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.candleStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.candleStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.candleStyle.borderDownColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.upColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.downColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.borderDownColor": "#3498db",
      "mainSeriesProperties.haStyle.upColor": "#e14549",
      "mainSeriesProperties.haStyle.downColor": "#3498db",
      "mainSeriesProperties.haStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.haStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.haStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.haStyle.borderDownColor": "#3498db",
      "study_Overlay@tv-basicstudies.style": 1,
      "study_Overlay@tv-basicstudies.lineStyle.color": "#351c75",
    },
  });
}

function tradingDarkView(symbol) {
  new TradingView.widget({
    width: 837,
    height: 600,
    symbol: symbol,
    interval: "1",
    timezone: "Asia/Seoul",
    theme: "dark",
    style: "1",
    locale: "kr",
    toolbar_bg: "#f1f3f6",
    enable_publishing: false,
    hide_top_toolbar: false,
    container_id: "tradingview_fd5a7",
    hide_side_toolbar: false,
    hidevolume: true,
    overrides: {
      "mainSeriesProperties.style": 1,
      "mainSeriesProperties.candleStyle.upColor": "#e14549",
      "mainSeriesProperties.candleStyle.downColor": "#3498db",
      "mainSeriesProperties.candleStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.candleStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.candleStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.candleStyle.borderDownColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.upColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.downColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.hollowCandleStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.hollowCandleStyle.borderDownColor": "#3498db",
      "mainSeriesProperties.haStyle.upColor": "#e14549",
      "mainSeriesProperties.haStyle.downColor": "#3498db",
      "mainSeriesProperties.haStyle.wickUpColor": "#e14549",
      "mainSeriesProperties.haStyle.wickDownColor": "#3498db",
      "mainSeriesProperties.haStyle.borderUpColor": "#e14549",
      "mainSeriesProperties.haStyle.borderDownColor": "#3498db",
      "study_Overlay@tv-basicstudies.style": 1,
      "study_Overlay@tv-basicstudies.lineStyle.color": "#351c75",
    },
  });
}

/*************************** 클릭 이벤트 Binding Start ******************************** */
// 툴팁버튼 이벤트
$("body").on("click", ".btn_tip", function () {
  $(this).toggleClass("selected");
});

function getOnlyNumber(value) {
  return Number(value.toString().replace(/,/g, ""));
}

function getDate(flag) {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth() + 1;
  var date = today.getDate();
  var hours = today.getHours();
  var minutes = today.getMinutes(); // 분
  var seconds = today.getSeconds(); // 초
  var milliseconds = today.getMilliseconds(); //밀리초

  month = month < 10 ? "0" + month : month;
  date = date < 10 ? "0" + date : date;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  if (flag == 1) {
    return (
      year +
      "-" +
      month +
      "-" +
      date +
      " " +
      hours +
      ":" +
      minutes +
      ":" +
      seconds
    );
  } else if (flag == 2) {
    return (
      year + "" + month + "" + date + "" + hours + "" + minutes + "" + seconds
    );
  } else {
    return hours + "" + minutes + "" + seconds;
  }
}

function getCoinName() {
  if (window.location.search) {
    var searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("coinName");
  } else {
    return "btcusdt";
  }
}

$(document).ready(function () {
  tradingOpenClose();
  modeSwitch3();
  modeSwitch4();
});

function tradingOpenClose() {
  var $openCloseButton = $("#openCloseButton");

  $($openCloseButton).click(function () {
    $(".order_wrap").toggleClass("hide");
    $(".tradingOpenClose input").toggleClass("active");
  });
}

function modeSwitch3() {
  var $darkModeSwitch = document.getElementById("modeSwitch");

  $darkModeSwitch.addEventListener("click", () => {
    setTimeout(function () {
      if (!document.documentElement.classList.contains("darkMode")) {
        localStorage.setItem("noDarkMode", true);
      } else {
        localStorage.removeItem("noDarkMode");
      }
      setTimeout(function () {
        location.reload();
      }, 200);
    }, 300);
  });
}

function modeSwitch4() {
  var $darkModeSwitch2 = document.getElementById("modeSwitch2");

  $darkModeSwitch2.addEventListener("click", () => {
    if (matchMedia("screen and (max-width: 1279px)").matches) {
      setTimeout(function () {
        if (!document.documentElement.classList.contains("darkMode")) {
          localStorage.setItem("noDarkMode", true);
        } else {
          localStorage.removeItem("noDarkMode");
        }
        setTimeout(function () {
          location.reload();
        }, 200);
      }, 300);
    }
  });
}
/* dark Mode */
