$(function () {
  setInitTickerList();
  WebsocketTickerinit();
  setInitGrid();
  setCheckList();

  $("#searchInput").keyup(function (e) {
    if (e.which == 27) {
      this.value = "";
    }
    dataView.setFilter(gridFilter);
  });
});

function gridFilter(rec) {
  var found,
    searchData = $.trim($("#searchInput").val()).toLowerCase().split(" ");

  for (i = 0; i < searchData.length; i += 1) {
    found = false;
    $.each(rec, function (obj, objValue) {
      if (
        typeof objValue !== "undefined" &&
        objValue != null &&
        objValue.toString().toLowerCase().indexOf(searchData[i]) != -1
      ) {
        found = true;
        return false;
      }
    });
    if (!found) {
      return false;
    }
  }
  return true;
}

var tickerData = { tickerDataList: [] };
var streamsLength = 0;
var dataView = null;
var grid = null;

function setInitTickerList() {
  streamsLength = coinNameInfo.length;
  for (var i = 0; i < streamsLength; i++) {
    var data = {
      symbol: coinNameInfo[i].name.toUpperCase() + "USDT",
      price: 0,
      percent: 0,
      name: coinNameInfo[i].name.toUpperCase(),
      volume: 0,
      fixed: coinNameInfo[i].fixed,
      fixed2: coinNameInfo[i].fixed2,
      nameKr: coinNameInfo[i].nameKr,
      changePrice: 0,
      coinName: coinNameInfo[i].symbol,
    };

    tickerData.tickerDataList.push(data);
  }
}
function WebsocketTickerinit() {
  let streams = [];
  for (var i = 0; i < streamsLength; i++) {
    streams.push(coinNameInfo[i].symbol);
  }
  let socketTicker = new WebSocket(
    " wss://stream.binance.com:9443/ws/" + streams.join("/")
  );
  socketTicker.onopen = function (event) {
    socketTickerOpen(event);
  };
  socketTicker.onmessage = function (event) {
    socketTickerMessage(event);
  };
  socketTicker.onclose = function (event) {
    socketTickerClose(event);
  };
}

function socketTickerOpen(event) {
  console.log("연결 완료 socketTicker");
}

function socketTickerClose(event) {
  WebsocketTickerinit();
}

function socketTickerMessage(event) {
  var data = JSON.parse(event.data);

  for (var i = 0; i < tickerData.tickerDataList.length; i++) {
    if (tickerData.tickerDataList[i].symbol == data.s) {
      tickerData.tickerDataList[i].price = parseFloat(data.c).toFixed(
        tickerData.tickerDataList[i].fixed
      );
      tickerData.tickerDataList[i].percent = parseFloat(data.P).toFixed(2);
      tickerData.tickerDataList[i].volume = (
        (parseFloat(data.q) * 0.0001).toFixed(2) * 0.01
      ).toFixed(2);
      tickerData.tickerDataList[i].changePrice = Number(data.p);
    }
  }
}

//웹소켓 종료
function disconnectTicker() {
  socketBookTicker.close();
  console.log("연결 종료 SOCKETBOOKTICKER");
}

function setCheckList() {
  setInterval(function () {
    for (var i = 0; i < streamsLength; i++) {
      grid.removeCellCssStyles(i);
      var name = $(grid.getCellNode(i, 1)).find(".symbolName");
      var price = $(grid.getCellNode(i, 2));
      var percent = $(grid.getCellNode(i, 3)).find(".percentSpan");
      var changePrice = $(grid.getCellNode(i, 3)).find(".changePriceSpan");
      var volume = $(grid.getCellNode(i, 4));

      if ($(name).text() == tickerData.tickerDataList[i].name) {
        $(name).text(tickerData.tickerDataList[i].name);
        $(price).text(tickerData.tickerDataList[i].price);
        $(percent).text(tickerData.tickerDataList[i].percent);
        $(changePrice).text(tickerData.tickerDataList[i].changePrice);
        $(volume).text(tickerData.tickerDataList[i].volume + "M");

        if (percent.text().indexOf("-") == 0) {
          $(price).addClass("slick-down");
          $(percent).addClass("slick-down");
          $(percent).text(percent.text() + "%");
          $(changePrice).addClass("slick-down");
          $(changePrice).text(changePrice.text());
        } else if (Number(percent.text()) > 0) {
          $(price).addClass("slick-up");
          $(percent).addClass("slick-up");
          $(percent).text("+" + percent.text() + "%");
          $(changePrice).addClass("slick-up");
          $(changePrice).text(changePrice.text());
        } else {
          $(price).addClass("slick-center");
          $(percent).addClass("slick-center");
          $(percent).text(percent.text() + "%");
          $(changePrice).text(changePrice.text());
        }
      }
    }
  }, 100);
}

function setInitGrid() {
  var investWrapHeight = $(".tradingContainer > div").height();
  var windowHeight = $(window).height();
  //console.log(investWrapHeight + " / " + windowHeight);
  // 그리드 사이즈 재 조정...
  //if (investWrapHeight < windowHeight || isScrolledIntoView($('#positionCheck'))) {
  //    $("#myGrid").css("height", (investWrapHeight - 44) + "px");
  //}
  //else {
  //    $("#myGrid").css("height", (windowHeight - 121) + "px");

  //}

  if (matchMedia("screen and (min-width: 1280px)").matches) {
    $("#myGrid").css("height", "1600px");
  } else if (matchMedia("screen and (max-width: 1279px)").matches) {
    $("#myGrid").css("height", "455px");
  }

  var ww = $(window).width();
  var limit = 1280;

  function refresh() {
    ww = $(window).width();
    var w =
      ww < limit
        ? location.reload(true)
        : ww > limit
        ? location.reload(true)
        : (ww = limit);
  }

  var tOut;
  $(window).resize(function () {
    var resW = $(window).width();
    clearTimeout(tOut);
    if ((ww > limit && resW < limit) || (ww < limit && resW > limit)) {
      tOut = setTimeout(refresh, 100);
    }
  });

  var imageFormatter = function (row, cell, value, columnDef, dataContex) {
    return (
      "<img style='width:30px; height:30px;' src='./images/coin/" +
      dataContex.name.toLowerCase() +
      ".png' />"
    );
    //var a = "<img style='width:30px; height:30px;' src='/images/coin/" + dataContex.name.toLowerCase() + ".png' />";
    //a += "<div class='slick-cell l1 r1'><span>11</span>"
    return a;
  };

  var nameFormatter = function (row, cell, value, columnDef, dataContex) {
    return (
      "<span class='symbolName'>" +
      dataContex.name +
      "</span>" +
      "<span class='symbolNameKr'>" +
      dataContex.nameKr +
      "/USDT</span>"
    );
  };

  var percentformatter = function (row, cell, value, columnDef, dataContex) {
    return (
      "<span class='percentSpan'>" +
      dataContex.percent +
      "</span>" +
      "<span class='changePriceSpan'>" +
      dataContex.changePrice +
      "</span>"
    );
  };

  //슬릭 그리드 컬럼 설정
  var columns = [
    {
      id: "",
      name: "",
      field: "",
      sortable: false,
      width: 55,
      minWidth: 20,
      maxWidth: 80,
      formatter: imageFormatter,
    },
    {
      id: "name",
      name: "한글명",
      field: "name",
      width: 118,
      sortable: true,
      formatter: nameFormatter,
    },
    {
      id: "price",
      name: "현재가",
      field: "price",
      width: 74,
      headerCssClass: "currency",
      cssClass: "slick-coulumns-text-right",
      sortable: true,
    },
    {
      id: "percent",
      name: "전일대비",
      field: "percent",
      width: 74,
      headerCssClass: "currency",
      cssClass: "slick-coulumns-text-right",
      sortable: true,
      formatter: percentformatter,
    },
    {
      id: "volume",
      name: "거래량",
      field: "volume",
      width: 75,
      headerCssClass: "currency",
      cssClass: "slick-coulumns-text-right",
      sortable: true,
    },
  ];

  //그리드 옵션들
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableAutoSizeColumns: true,
    rowHeight: "42",
  };

  dataView = new Slick.Data.DataView();
  grid = new Slick.Grid("#myGrid", dataView, columns, options);

  dataView.onRowsChanged.subscribe(function (e, args) {
    grid.invalidateRows(args.rows);
    grid.render();
  });

  dataView.onRowCountChanged.subscribe(function (e, args) {
    grid.updateRowCount();
    grid.render();
  });

  dataView.setItems(tickerData.tickerDataList, "name");

  grid.onSort.subscribe(function (e, args) {
    if (args.sortCol.field == "name") {
      args.sortAsc == true
        ? dataView.fastSort("name", false)
        : dataView.fastSort("name", true);
    } else {
      tickerData.tickerDataList.sort(function (dataRow1, dataRow2) {
        var sortName = args.sortCol.nam;
        var field = args.sortCol.field;
        var sign = args.sortAsc ? 1 : -1;
        var value1;
        var value2;
        if (sortName == "Change") {
          var temp = dataRow1[field].replace("+", "");
          temp = dataRow1[field].replace("%", "");
          value1 = Number(temp);

          temp = dataRow2[field].replace("+", "");
          temp = dataRow2[field].replace("%", "");
          value2 = Number(temp);
        } else {
          value1 = Number(dataRow1[field]);
          value2 = Number(dataRow2[field]);
        }

        if (value1 == undefined) value1 = "";
        if (value2 == undefined) value2 = "";

        var result = (value1 == value2 ? 0 : value1 > value2 ? 1 : -1) * sign;
        return result;
      });
      dataView.refresh();
    }
  });

  // 여기도 수정하자... 그냥 주소만 넘기는걸로하고 코인 디테일 정보는 디비에서 가져오쟈....
  grid.onClick.subscribe(function (e, args) {
    //localStorage.setItem("selectCoinInfo", JSON.stringify(grid.getData().getItem(args.row)));
    var coinName = grid.getData().getItem(args.row).symbol.toLowerCase();
    window.location.href = "/Trading.aspx?coinName=" + coinName;
  });
}
