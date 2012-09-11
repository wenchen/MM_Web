<?php
require_once 'Twig/Autoloader.php';
Twig_Autoloader::register();

function utf8_clean($str)
{
    return iconv('UTF-8', 'UTF-8//IGNORE', $str);
}

$_messages = array(
    JSON_ERROR_NONE => 'No error has occurred',
    JSON_ERROR_DEPTH => 'The maximum stack depth has been exceeded',
    JSON_ERROR_STATE_MISMATCH => 'Invalid or malformed JSON',
    JSON_ERROR_CTRL_CHAR => 'Control character error, possibly incorrectly encoded',
    JSON_ERROR_SYNTAX => 'Syntax error',
    JSON_ERROR_UTF8 => 'Malformed UTF-8 characters, possibly incorrectly encoded'
);

//working variable
//source: https://pipos.tv/?post=12345 --> $query['scheme']=https, $query['host']=pipos.tv, $query['url'] = '/', $query['post'] = "12345"
$query = $_GET;

// 是否為debug模式
$debug = false;
if(isset($query['debug']) && $query['debug'] == 1) {
    $debug = true;
}

// 分析URL
$cat = 'main';
if(isset($query['post'])) {
    $cat = 'post';
}

//拿DATA
$object = array();
if($cat == 'post') {
    $URL="http://10.150.162.125:1688/Post/";
    $postData = "_id=".urlencode($query['post']);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $URL);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    //$result = utf8_clean($result);
    curl_close ($ch);

    $object = json_decode($result, true);//print_r($object);
    $json_decode_error = $_messages[json_last_error()];
    $object = $object['json'][0]['Message'][1]['Data'];
}

//設定Sub分類
$subcat = "";
if($cat == 'post') {
    $subcat = ".".$object['Post']['Type'];
}
//設定url
$url = $query['scheme']."://".$query['host']."/";
if($cat != "main") {
    $url .= '?'.$cat.'='.urlencode($query[$cat]);
}
$object['url'] = $url;

//設定debug資料
$bodyText = "";
if($debug) {
    $bodyText .= '<p>Query String: '.json_encode($query).'</p>';
    $bodyText .= '<p>DB Query Data: '.$result.'</p>';
    $bodyText .= '<p>Decoded Data: '.json_encode($object).'</p>';
    $bodyText .= '<p>JSON Decode Error: '.$json_decode_error.'</p>';
}
$object['bodyText'] = $bodyText;

//生HTML
#開始生資料，根據object['Post']['Type']決定使用的template
$is_error = false;
$content = "";
try {
    $content = "";
    $loader = new Twig_Loader_Filesystem('tpl/');
    $twig = new Twig_Environment($loader, array('cache' => '/tmp/ogrobot',));
    $content = $twig->render($cat.$subcat.'.html', $object);
} catch (Exception $e) {
    #錯誤發生
    $is_error = true;
}

if ($is_error == true || $content == "") {
    $content = "";
    $object = array();
    $object['url'] = $url;
    $object['bodyText'] = $bodyText;
    $loader = new Twig_Loader_Filesystem('tpl/');
    $twig = new Twig_Environment($loader, array('cache' => '/tmp/ogrobot',));
    $content = $twig->render('main.html', $object);
}

echo $content;

?>