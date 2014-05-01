<?php 

//DISCLAIMER:
//LIMITATION OF LIABILITY: uptime software does not warrant that software obtained
//from the Grid will meet your requirements or that operation of the software will
//be uninterrupted or error free. By downloading and installing software obtained
//from the Grid you assume all responsibility for selecting the appropriate
//software to achieve your intended results and for the results obtained from use
//of software downloaded from the Grid. uptime software will not be liable to you
//or any party related to you for any loss or damages resulting from any claims,
//demands or actions arising out of use of software obtained from the Grid. In no
//event shall uptime software be liable to you or any party related to you for any
//indirect, incidental, consequential, special, exemplary or punitive damages or
//lost profits even if uptime software has been advised of the possibility of such
//damages.

require_once $_SERVER['DOCUMENT_ROOT'] . "/includes/classLoader.inc";



session_start();

$user_name =  $_SESSION['current_user']->getName();
$user_pass = $_SESSION['current_user']->getPassword();

session_write_close();


// Set the JSON header
header("Content-type: text/json");

include("uptimeDB.php");
include("uptimeApi.php");



if (isset($_GET['query_type'])){
    $query_type = $_GET['query_type'];
}
else{
    exit(1);
}
if (isset($_GET['time_frame'])){
    $time_frame = $_GET['time_frame'];
}
if (isset($_GET['device_id'])){
    $device_id = $_GET['device_id'];
}

if (isset($_GET['port_id'])){
    $if_index = $_GET['port_id'];
}

$json = array();

$db = new uptimeDB;
if ($db->connectDB())
{
    echo "";

}
else
{
 echo "unable to connect to DB exiting";    
 exit(1);
}

// Enumerate devices
if ($query_type == "network_devices_via_db") {
    $sql = "SELECT entity_id, name, display_name
            FROM entity
            WHERE entity_type_id = 2
            ORDER BY display_name";

    $result = $db->execQuery($sql);

    foreach ($result as $row) {
        $json[$row['DISPLAY_NAME']] = $row['ENTITY_ID'];
        } 
    // Echo results as JSON
    echo json_encode($json);
}

elseif ($query_type =="network_devices") {

$uptime_api_username = $user_name;
$uptime_api_password = $user_pass;
$uptime_api_hostname = "localhost";     // up.time Controller hostname (usually localhost, but not always)
$uptime_api_port = 9997;
$uptime_api_version = "v1";
$uptime_api_ssl = true;

// Create API object
$uptime_api = new uptimeApi($uptime_api_username, $uptime_api_password, $uptime_api_hostname, $uptime_api_port, $uptime_api_version, $uptime_api_ssl);

$devices = $uptime_api->getElements("type=NetworkDevice&isMonitored=1");

foreach ($devices as $d) {
    $json[$d['name']] = $d['id'];
}

echo json_encode($json);
}


// Enumerate network device ports
elseif ($query_type == "network_ports") {
    $sql = "SELECT ndpc.id, ndpc.entity_id, ndpc.if_index, ndpc.if_name
            FROM net_device_port_config ndpc
            JOIN entity_configuration ec on ec.entity_id = ndpc.entity_id
            INNER JOIN net_device_perf_latest_sample on net_device_perf_latest_sample.entity_id = ndpc.entity_id
            INNER JOIN net_device_perf_port perfPort ON (perfPort.sample_id = net_device_perf_latest_sample.sample_id
                AND ndpc.if_index = perfPort.if_index)
            WHERE ndpc.entity_id = $device_id
            AND ndpc.if_admin_status = 1
            and perfPort.kbps_total_rate is not null
            ORDER BY ndpc.if_index";

    $result = $db->execQuery($sql);

    foreach ($result as $row) {
        $json[$row['IF_NAME']] = $row['IF_INDEX'];
        }

    // Echo results as JSON
    echo json_encode($json);
}


// Get network metrics for a specific device and port
elseif ($query_type == "network_port_metrics") {
    $sql = "SELECT  ps.id, ps.sample_time,
                    e.entity_id,
                    e.name entity_name,
                    portConf.if_index,
                    portConf.if_name,
                    portConf.if_speed, 
                    perfPort.kbps_in_rate,
                    perfPort.kbps_out_rate,
                    perfPort.kbps_total_rate, 
                    perfPort.discards_in_rate D_IN_RATE,
                    perfPort.discards_out_rate D_OUT_RATE,
                    perfPort.discards_total_rate D_TOT_RATE, 
                    perfPort.errors_in_rate E_IN_RATE,
                    perfPort.errors_out_rate E_OUT_RATE,
                    perfPort.errors_total_rate E_TOT_RATE, 
                    perfPort.usage_in_percent USAGE_IN_PER,
                    perfPort.usage_out_percent USAGE_OUT_PER,
                    perfPort.usage_percent USAGE_PER
            FROM net_device_perf_latest_sample lastSample
            INNER JOIN entity e ON e.entity_id = lastSample.entity_id
            INNER JOIN net_device_port_config portConf ON e.entity_id = portConf.entity_id
            INNER JOIN net_device_perf_port perfPort ON (perfPort.sample_id = lastSample.sample_id
                AND portConf.if_index = perfPort.if_index)
            INNER JOIN net_device_perf_sample ps ON ps.id = perfPort.sample_id
            WHERE e.entity_id = $device_id
                AND portConf.if_index = $if_index";


    $result = $db->execQuery($sql);

    foreach ($result as $row) {
        $sample_time = strtotime($row['SAMPLE_TIME']);
        $x = $sample_time * 1000;
        
        $if_speed = $row['IF_SPEED'];
        $kbps_in_rate = $row['KBPS_IN_RATE'];
        $kbps_out_rate = $row['KBPS_OUT_RATE'];
        $kbps_total_rate = $row['KBPS_TOTAL_RATE'];
        $discards_in_rate = $row['D_IN_RATE'];
        $discards_out_rate = $row['D_OUT_RATE'];
        $discards_total_rate = $row['D_TOT_RATE'];
        $errors_in_rate = $row['E_IN_RATE'];
        $errors_out_rate = $row['E_OUT_RATE'];
        $errors_total_rate = $row['E_TOT_RATE'];
        $usage_in_percent = $row['USAGE_IN_PER'];
        $usage_out_percent = $row['USAGE_OUT_PER'];
        $usage_percent = $row['USAGE_PER'];
        
        $y = array("if_speed" => $if_speed, "kbps_in_rate" => $kbps_in_rate, "kbps_out_rate" => $kbps_out_rate, "kbps_total_rate" => $kbps_total_rate,
              "discards_in_rate" => $discards_in_rate, "discards_out_rate" => $discards_out_rate, "discards_total_rate" => $discards_total_rate,
              "errors_in_rate" => $errors_in_rate, "errors_out_rate" => $errors_out_rate, "errors_total_rate" => $errors_total_rate,
              "usage_in_percent" => $usage_in_percent, "usage_out_percent" => $usage_out_percent, "usage_percent" => $usage_percent);
    }
    
    $metric = array($x, $y);
    array_push($json, $metric);
        

    echo json_encode($json);
} 


    
// Unsupported request
else {
    echo "Error: Unsupported Request '$query_type'" . "</br>";
    echo "Acceptable types are 'elements', 'monitors', and 'metrics'" . "</br>";
    }

?>