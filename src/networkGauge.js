// Initialize variables
var uptimeHost = 'localhost';
var debugMode = null;
var interval = null;
var requestString = null;
var myChart = null;
var myChartDimensions = null;
var renderSuccessful = null;  //Add this later
var divsToDim = ['#widgetChart', '#widgetSettings'];
var settings = {deviceId: null, portId: null, metricId: null, refreshInterval: null,
                chartTitle: null, seriesTitle: null, thresholdValues: null};
var refreshIntervalOptions = {"10000" : "10 seconds", "30000" : "30 seconds",
    "60000" : "minute", "300000" : "5 minutes",
    "600000" : "10 minutes"};
var refreshIntervalSliderOptions = {"1" : "10000", "2" : "30000", "3" : "60000",
    "4" : "300000", "5" : "600000" };
var gadgetInstanceId = uptimeGadget.getInstanceId();
//var gadgetGetMetricsPath = '/gadgets/instances/' + gadgetInstanceId + '/getNetworkDeviceMetrics.php';
var currentURL = $("script#ownScript").attr("src");
var gadgetGetMetricsPath = currentURL.substr(0,$("script#ownScript").attr("src").lastIndexOf("/")+1) + 'getNetworkDeviceMetrics.php';
var normalGetMetricsPath = 'getNetworkDeviceMetrics.php';
var relativeGetMetricsPath = '/gadgets/networkgauge/getNetworkDeviceMetrics.php';
var getMetricsPath = gadgetGetMetricsPath;
// Set chart options
var commonChartOptions = {
    credits: {enabled: false},
    title: {
        text: ''
    },
    plotOptions: {
        gauge: {
            dial: {
                radius: '75%',
                baseWidth: 8,
                rearLength: '-70%',
                backgroundColor: '#4d4e53',
                borderColor: '9a9b9d',
                borderWidth: 1
            },
            pivot: {
                radius: 0
            }
        }
    },
    // the value axis
    yAxis: {
        min: 0,
        max: 100,

        minorTickInterval: 'auto',
        minorTickWidth: 0.5,
        minorTickLength: 6,
        minorTickPosition: 'inside',
        minorTickColor: 'black',

        tickPixelInterval: 30,
        tickWidth: 1,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#4d4e53',
        labels: {
            step: 2,
            rotation: 'auto'
        },
        plotBands: [{
            from: 0,
            to: 75,
            color: '#5CB85C' // green
        }, {
            from: 75,
            to: 90,
            color: '#F0AD4E' // light orange
        }, {
            from: 90,
            to: 100,
            color: '#D9534F' // red
        }]
    }
}
var topChartOptions = {
    chart: {
        renderTo: 'topChart',
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: true,
        width: 320,
        height: 150,
        marginTop: 1,
        marginBottom: -180
    },
    pane: {
        startAngle: -70,
        endAngle: 70,
        background: [{
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#FFF'],
                    [1, '#333']
                ]
            },
            borderWidth: 0,
            outerRadius: '100%'
        }, {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#333'],
                    [1, '#FFF']
                ]
            },
            borderWidth: 0,
            outerRadius: '100%'
        }, {
            // default background
        }, {
            backgroundColor: '#DDD',
            borderWidth: 0,
            outerRadius: '104%',
            innerRadius: '104%'
        }]
    },
    tooltip: {
        valueSuffix: '%',
        positioner: function () {
            return { x: 110, y: 80 };
        }
    },
    series: [{
        name: "Inbound",
        dataLabels: {
            enabled: false
        },
        data: [50]
    }]
};
var bottomChartOptions = {
    chart: {
        renderTo: 'bottomChart',
        type: 'gauge',
        plotBackgroundColor: null,
        plotBackgroundImage: null,
        plotBorderWidth: 0,
        plotShadow: true,
        width: 320,
        height: 150,
        marginTop: -180,
        marginBottom: 1
    },
    pane: {
        startAngle: 110,
        endAngle: 250,
        background: [{
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#FFF'],
                    [1, '#333']
                ]
            },
            borderWidth: 0,
            outerRadius: '100%'
        }, {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#333'],
                    [1, '#FFF']
                ]
            },
            borderWidth: 0,
            outerRadius: '100%'
        }, {
            // default background
        }, {
            backgroundColor: '#DDD',
            borderWidth: 0,
            outerRadius: '104%',
            innerRadius: '104%'
        }]
    },
    tooltip: {
        valueSuffix: '%',
        positioner: function () {
            return { x: 110, y: 30 };
        }
    },
    series: [{
        name: 'Outbound',
        dataLabels: {
            enabled: false
        },
        data: [50]
    }]
};
$.extend(topChartOptions, commonChartOptions);
$.extend(bottomChartOptions, commonChartOptions);

if (debugMode) {
    console.log('Metric Chart: Debug logging enabled');
}

if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Current path to getNetworkDeviceMetrics.php: '
    + getMetricsPath)};

// Initialize handlers
uptimeGadget.registerOnEditHandler(showEditPanel);
uptimeGadget.registerOnLoadHandler(function(onLoadData) {
    if (onLoadData.hasPreloadedSettings()) {
        goodLoad(onLoadData.settings);
    } else {
        uptimeGadget.loadSettings().then(goodLoad, onBadAjax);
    }
});
uptimeGadget.registerOnResizeHandler(resizeGadget);

// Populate configuration options
populateOptions();

// Unleash the popovers!
var popOptions = { delay: {show: 1000}}
var popTargets = [  $("#device-div"), $("#port-div"), $("#metric-div"),
                    $("#refreshIntervalSliderAndLabel"), $("#thresholdSlidersAndLabels")]
$.each (popTargets, function(index, target) {
    target.popover(popOptions)
});

// Clear alerts and save settings on configuration closure
$("#closeSettings").click(function() {
    saveSettings();
    $("#inboundMetricsContent").empty();
    $("#outboundMetricsContent").empty();
    $("#totalMetricsContent").empty();
});
// Close configuration dialog without making changes
$("#closeNoSave").click(function() {
    $("#widgetSettings").slideUp();
});
// Open config panel on double-click
$("#chart-div").dblclick(function() {
    showEditPanel();
});
// Toggle debug logging on double-click of 'eye' icon
$("#visualOptionsIcon").dblclick(function() {
    if (debugMode == null) {
        debugMode = true;
        console.log('Gadget #' + gadgetInstanceId + ' - Debug logging enabled');
    } else if (debugMode == true) {
        debugMode = false;
        console.log('Gadget #' + gadgetInstanceId + ' - Debug logging disabled');
    }
});
// Device changed
$("select.devices").on('change', function(evt, params) {
    deviceId = $("select.devices").val();
    $("#port-count").text($('#ports option').length);
    populatePorts();
});
function populateDevices() {
    requestString = getMetricsPath + '?uptime_host=' + uptimeHost + '&query_type=network_devices';
    if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Requesting: ' + requestString)};
    $.getJSON(requestString, function(data) {
    }).done(function(data) {
            if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Request succeeded!')};
            $("select.devices").empty();
            $.each(data, function(key, val) {
                $("select.devices").append('<option value="' + val + '">' + key + '</option>');
            });
            if (typeof deviceId !== 'undefined') {
                if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Setting network device dropdown to: '
                    + deviceId)};
                $("select.devices").val(deviceId).trigger("chosen:updated").trigger('change');
            } else {
                $("select.devices").trigger("chosen:updated").trigger('change');
            }
            $("#device-count").text($('#devices option').length);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('Gadget #' + gadgetInstanceId + ' - Request failed! ' + textStatus);
        }).always(function() {
            // console.log('Request completed.');
        });
}

function populatePorts() {
    requestString = getMetricsPath  + '?uptime_host=' + uptimeHost + '&query_type=network_ports'
                                    + '&device_id=' + deviceId;
    if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Requesting: ' + requestString)};
    $.getJSON(requestString, function(data) {
    }).done(function(data) {
            if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Request succeeded!')};
            $("select.ports").empty();
            $.each(data, function(key, val) {
                $("select.ports").append('<option value="' + val + '">' + key + '</option>');
            });
            if (typeof portId !== 'undefined') {
                if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Setting network port dropdown to: '
                    + portId)};
                $("select.ports").val(portId).trigger("chosen:updated").trigger('change');
            } else {
                $("select.ports").trigger("chosen:updated").trigger('change');
            }
            $("#port-count").text($('#ports option').length);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('Gadget #' + gadgetInstanceId + ' - Request failed! ' + textStatus);
        }).always(function() {
            // console.log('Request completed.');
        });
}

// Key functions
function populateOptions() {
    $("#refreshIntervalSlider").slider({
        range: "max", value: 4, min: 1, max: 5, animate: true,
        slide: function( event, ui ) {
            $("#refreshIntervalLabelContents").text('Every '
                + refreshIntervalOptions[refreshIntervalSliderOptions[ui.value]]);
        }
    });

    $("#thresholdSlider").slider({
        range: true, values: [75, 90], min: 1, max: 100, animate: true,
        slide: function( event, ui ) {
            $("#warningThreshold").text('Warning: ' + ui.values[0]);
            $("#criticalThreshold").text('Critical: ' + ui.values[1]);
            thresholdValues = [ui.values[0], ui.values[1]];
        }
    });

    $("select.devices").chosen();
    $("select.ports").chosen();
    $("select.metrics").chosen();

    $("select.metrics").append('<option selected value="traffic">Traffic Rate (In+Out)</option>');
    $("select.metrics").append('<option disabled value="discards">More metrics to come!</option>');
    $("select.metrics").trigger("chosen:updated");

    $("#inboundMetricsLabel").append('&nbsp;&nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ ');
    $("#outboundMetricsLabel").append('&nbsp;&nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ ');
    $("#totalMetricsLabel").append('&nbsp;&nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ &nbsp; ∙ ');

    populateDevices();
}

function showEditPanel() {
    if (myChart) {
        myChart.stopTimer();
    }
    $("#widgetBody").slideDown(function() {
        $("#widgetSettings").slideDown();
    });
    $("#widgetChart").height($(window).height());
}

function saveSettings() {
    settings.deviceId = $("select.devices").val();
    settings.portId = $("select.ports").val();
    settings.metricId = $("select.metrics").val();
    settings.thresholdValues = $("#thresholdSlider").slider("option", "values");
    settings.seriesTitle = $('select.metrics option:selected').text();
    refreshIntervalIndex = $("#refreshIntervalSlider").slider("value");
    settings.refreshInterval = refreshIntervalSliderOptions[refreshIntervalIndex];

    uptimeGadget.saveSettings(settings).then(onGoodSave, onBadAjax);
}

function loadSettings(settings) {
    console.log('Gadget #' + gadgetInstanceId + ' - Loaded settings: ' + printSettings(settings));

    showEditPanel();

    deviceId = settings.deviceId;
    portId = settings.portId;
    metricId = settings.metricId;
    thresholdValues = settings.thresholdValues;
    refreshInterval = settings.refreshInterval;
    seriesTitle = settings.seriesTitle;

    if (typeof refreshInterval !== 'undefined') {
        if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Setting refresh interval slider to: '
            + refreshInterval)};
        $.each(refreshIntervalSliderOptions, function(k, v) {
            if (v == refreshInterval) {
                if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Setting refresh rate to: '
                    + refreshInterval + ' and refreshRateSlider to '
                    + refreshIntervalOptions[refreshIntervalSliderOptions[k]])};
                $("#refreshIntervalSlider").slider("value", k);
                $("#refreshIntervalLabelContents").text('Every '
                    + refreshIntervalOptions[refreshIntervalSliderOptions[k]]);
            }
        });
    }

    if (typeof thresholdValues !== 'undefined') {
        if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Setting warning threshold slider to: '
            + thresholdValues[0] + ' and critical threshold slider to' + thresholdValues[1])};
        $("#thresholdSlider").slider("option", "values", thresholdValues);
        $("#warningThreshold").text('Warning: ' + thresholdValues[0]);
        $("#criticalThreshold").text('Critical: ' + thresholdValues[1]);
    }
}

function goodLoad(settings) {
    clearStatusBar();
    if (settings) {
        loadSettings(settings);
        displayChart(settings);
    } else if (uptimeGadget.isOwner()) { // What does this do?
        $('#widgetChart').hide();
        showEditPanel();
    }
}

function onGoodSave() {
    clearStatusBar();
    console.log('Gadget #' + gadgetInstanceId + ' - Saved settings: ' + printSettings(settings));
    parent.location.reload();       // Try to avoid having to do this
    displayChart(settings);
}

function printSettings(settings) {
    var printString = 'deviceId: ' + settings.deviceId + ', portId: ' + settings.portId + ', metricId: ' + settings.metricId
                    + ', thresholdValues: ' + settings.thresholdValues + ', refreshInterval: ' + settings.refreshInterval
                    + ', seriesTitle: ' + settings.seriesTitle;
    return printString;
}

function displayChart(settings) {

    if (myChart)  { myChart.stopTimer();
                    myChart.destroy();
                    myChart = null};

    if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Graph refresh rate: '
        + (settings.refreshInterval / 1000) + ' seconds')};

    chartHeight = $(window).height();
    $("#widgetChart").height(chartHeight);
    $("#widgetChart").css('margin-top', (chartHeight - 343) / 2);

    $("#closeSettings").button('loading');
    $("#widgetBody").slideUp();
    $("#loading-div").show('fade');

    requestString = getMetricsPath  + '?uptime_host=' + uptimeHost + '&query_type=network_port_metrics'
        + '&device_id=' + settings.deviceId + '&port_id=' + settings.portId;
    if (debugMode) {console.log('Gadget #' + gadgetInstanceId + ' - Requesting: ' + requestString)};

    var ajaxRequest = $.ajax({url: requestString, dataType: 'json'},
        function(data) {})
        .done (function( data ) {
            if (data.length < 1) {
                errorMessage = "There isn't enough monitoring data available for this port.";
                displayError(errorMessage,requestString);
                showEditPanel();
                $("#closeSettings").button('reset');
                $("#widgetBody").slideDown();
                $("#loading-div").hide('fade');
            } else {
                // Parse JSON response
                if (data[0][1]) {
                    if (debugMode) {
                        console.log('Gadget #' + gadgetInstanceId + ' - Response: ' + JSON.stringify(data[0]))
                    };
                    //$("#topChart").empty();
                    //$("#bottomChart").empty();
                    $("#chartStats").show();

                    renderChart(settings, data);
                    clearInterval(interval);
                    interval = setInterval(function() {
                                    renderChart(settings, data)},
                                        settings.refreshInterval);
                    $("#closeSettings").button('reset');
                    $("#loading-div").hide('fade');
                    $("#widgetSettings").slideUp();
                    $("#alertModal").modal('hide');
                } else {
                    errorMessage = "There isn't enough monitoring data available for this port.";
                    displayError(errorMessage,requestString);
                    ajaxRequest.abort();
                }
            }})
        .fail (function(jqXHR, textStatus, errorThrown) {
            errorMessage = 'HTTP Status Code ' + jqXHR.status;
            displayError(errorMessage,requestString);
    });
}

function renderChart(settings, data) {
    time_stamp = data[0][0];
    if_speed = parseInt(data[0][1]["if_speed"]);
    kbps_in_rate = data[0][1]["kbps_in_rate"];
    //kbps_in_rate = parseInt(data[0][1]["kbps_in_rate"]) * 50;     // Modeling data
    kbps_out_rate = data[0][1]["kbps_out_rate"];
    //kbps_out_rate = parseInt(data[0][1]["kbps_out_rate"]) * 160;  // Modeling data
    kbps_total_rate = data[0][1]["kbps_total_rate"];
    //kbps_total_rate = kbps_in_rate + kbps_out_rate;               // Modeling data
    percent_in_rate = Math.round(kbps_in_rate / if_speed * 100);
    mbps_in_rate = (kbps_in_rate / 1000).toFixed(2);
    percent_out_rate = Math.round(kbps_out_rate / if_speed * 100);
    mbps_out_rate = (kbps_out_rate / 1000).toFixed(2);
    percent_total_rate = Math.round((kbps_total_rate / if_speed * 100) / 2);
    mbps_total_rate = (kbps_total_rate / 1000).toFixed(2);
    thresholdValues = settings.thresholdValues;

    topChartOptions.series[0].data = [parseInt(percent_in_rate)];
    bottomChartOptions.series[0].data = [parseInt(percent_out_rate)];

    topChartOptions.yAxis.plotBands = [{from: 0, to: thresholdValues[0], color: '#5CB85C'},
                                        {from: thresholdValues[0], to: thresholdValues[1], color: '#F0AD4E'},
                                        {from: thresholdValues[1], to: 100, color: '#D9534F'}];
    bottomChartOptions.yAxis.plotBands = [{from: 0, to: thresholdValues[0], color: '#5CB85C'},
                                            {from: thresholdValues[0], to: thresholdValues[1], color: '#F0AD4E'},
                                            {from: thresholdValues[1], to: 100, color: '#D9534F'}];

    var topChart = new Highcharts.Chart(topChartOptions);
    var bottomChart = new Highcharts.Chart(bottomChartOptions);

    if (percent_in_rate <= thresholdValues[0]) {
        inStatus = 'success';
    } else if (percent_in_rate >= thresholdValues[0] && percent_in_rate <= thresholdValues[1]) {
        inStatus = 'warning';
    } else if (percent_in_rate >= thresholdValues[1]) {
        inStatus = 'danger';
    } else {
        inStatus = 'info';
    }

    if (percent_out_rate <= thresholdValues[0]) {
        outStatus = 'success';
    } else if (percent_out_rate >= thresholdValues[0] && percent_out_rate <= thresholdValues[1]) {
        outStatus = 'warning';
    } else if (percent_out_rate >= thresholdValues[1]) {
        outStatus = 'danger';
    } else {
        outStatus = 'info';
    }

    if (percent_total_rate <= thresholdValues[0]) {
        totalStatus = 'success';
    } else if (percent_total_rate >= thresholdValues[0] && percent_total_rate <= thresholdValues[1]) {
        totalStatus = 'warning';
    } else if (percent_total_rate >= thresholdValues[1]) {
        totalStatus = 'danger';
    } else {
        totalStatus = 'info';
    }

    $("#inboundMetricsContent").empty().append('<span class="label label-' + inStatus + '"> ∙ &nbsp; ' + percent_in_rate
                                                            + '% &nbsp; • &nbsp; ' + mbps_in_rate + ' Mbps </span>');
    $("#outboundMetricsContent").empty().append('<span class="label label-' + outStatus + '"> ∙ &nbsp; ' + percent_out_rate
                                                            + '% &nbsp; • &nbsp; ' + mbps_out_rate + ' Mbps </span>');
    $("#totalMetricsContent").empty().append('<span class="label label-' + totalStatus + '"> ∙ &nbsp; ' + percent_total_rate
                                                            + '% &nbsp; • &nbsp; ' + mbps_total_rate + ' Mbps </span>');
}

function displayError(errorMessage,requestString) {
    console.log('Gadget #' + gadgetInstanceId + ' - Error: ' + errorMessage);
    $("#alertModalBody").empty();
    $("#alertModalBody").append('<p class="text-danger"><strong>Error:</strong> ' + errorMessage + '</p>'
        + 'Here is the request string which has resulted in this error:'
        + '<br><blockquote>' + requestString + '</blockquote>');
    $("#alertModal").modal('show');
    showEditPanel();
    $("#closeSettings").button('reset');
    $("#loading-div").hide('fade');
}
// Static functions
function displayStatusBar(msg) {
    gadgetDimOn();
    var statusBar = $("#statusBar");
    statusBar.empty();
    var errorBox = uptimeErrorFormatter.getErrorBox(msg);
    errorBox.appendTo(statusBar);
    statusBar.slideDown();
}
function clearStatusBar() {
    gadgetDimOff();
    var statusBar = $("#statusBar");
    statusBar.slideUp().empty();
}
function resizeGadget(dimensions) {
    chartHeight = $(window).height();
    $("#widgetChart").height(chartHeight);
    $("#widgetChart").css('margin-top', (chartHeight - 343) / 2);
    myChartDimensions = toMyChartDimensions(dimensions);
    if (myChart) {
        myChart.resize(myChartDimensions);
    }
}
function toMyChartDimensions(dimensions) {
    return new UPTIME.pub.gadgets.Dimensions(Math.max(100, dimensions.width - 5), Math.max(100, dimensions.height));
}
function onBadAjax(error) {
    displayStatusBar(error, "Error Communicating with up.time");
}
function gadgetDimOn() {
    $.each(divsToDim, function(i, d) {
        var div = $(d);
        if (div.is(':visible') && div.css('opacity') > 0.6) {
            div.fadeTo('slow', 0.3);
        }
    });
}
function gadgetDimOff() {
    $.each(divsToDim, function(i, d) {
        var div = $(d);
        if (div.is(':visible') && div.css('opacity') < 0.6) {
            div.fadeTo('slow', 1);
        }
    });
}