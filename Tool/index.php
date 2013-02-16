<?php
require 'fbsdk/facebook.php';

$reqURI = $_SERVER['REQUEST_URI'];
$reqURI = str_replace('/landing', '', $reqURI);
$url = parse_url($reqURI);
parse_str($url['query'],$query);

$facebook = new Facebook(array(
  'appId'  => '286934128081818',
  'secret' => 'f9b52ebed347ff09c9db8710c7ec0d93',
));

// Get User ID
$user = $facebook->getUser();

if ($user) {
  try {
    $user_profile = $facebook->api('/me');
    $locale = $user_profile['locale'];
  } catch (FacebookApiException $e) {
    error_log($e);
    $user = null;
    $locale = 'zh_TW';
  }
}

if(strlen($locale) < 1) {
  $locale = 'zh_TW';
}

$query['locale'] = $locale;
$q_str = http_build_query($query);

header("Location: https://mmgame.pipos.tv".$url['path']."?".$q_str);
?>
