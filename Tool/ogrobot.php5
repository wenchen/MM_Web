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
$reqURI = $_SERVER['REQUEST_URI']; // value: /[TYPE]/[encoded URL].html /gameover/XXXXXXXXXXXX
$subURIs = explode('?', $reqURI);
$reqURI = $subURIs[0];
$gameId = str_replace('/gameover/', '', $reqURI); //print_r($gameId);

//拿DATA
$object = array();
$URL="http://127.0.0.1:5566/api/Paper/";
$postData = "view_paper_id=".$gameId;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $URL);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$result = curl_exec($ch);//print_r($result);
//$result = utf8_clean($result);
curl_close ($ch);

$object = json_decode($result, true);//print_r($object);
$json_decode_error = $_messages[json_last_error()];
$object = $object['json'][0]['Message'][1]['Data'];

if(!$object['locale']) {
    $object['locale'] = 'zh_TW';
}

//拿Language
$langURL = "http://127.0.0.1:5566/api/Language/";
$postData = "lang=".$object['locale'];
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $langURL);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$result = curl_exec($ch);//print_r($result);
//$result = utf8_clean($result);
curl_close ($ch);
$langObj = json_decode($result, true);
$langObj = $langObj['json'][0]['Message'][1]['Data']['data'];

$object['url'] = 'https://apps.facebook.com/memorymillionaire'.$reqURI;
$object['userimage'] = 'http://graph.facebook.com/'.$object['creator']['user_fb_id'].'/picture?width=200&height=200';
$object['lang'] = $langObj;

//生HTML
#開始生資料，根據object['Post']['Type']決定使用的template
$content = "";
try {
    $content = "";
    $loader = new Twig_Loader_Filesystem('./');
    $twig = new Twig_Environment($loader);
    $content = $twig->render('ogrobot.html', $object);
} catch (Exception $e) {
print_r($e);
}

echo $content;

?>