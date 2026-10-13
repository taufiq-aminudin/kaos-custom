<?php
define('SITE_NAME','Kaos Custom');
define('ADMIN_USERNAME','admin');
define('ADMIN_PASSWORD_HASH','$2y$12$.g905I9OJEf1TdIuhFeX6.6G0aX9Kg3WIGzwYxZTfvdDAqZtN2BGm'); // Ganti sebelum online!
define('MAX_UPLOAD_BYTES',5*1024*1024);
define('DATA_FILE',__DIR__.'/data/products.json');
define('UPLOAD_DIR',__DIR__.'/uploads/');
if(session_status()===PHP_SESSION_NONE){session_name('kaoscustom_session');session_start();}
function h($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function products_read(){$d=file_exists(DATA_FILE)?json_decode(file_get_contents(DATA_FILE),true):[];return is_array($d)?$d:[];}
function products_write($p){return file_put_contents(DATA_FILE,json_encode(array_values($p),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),LOCK_EX)!==false;}
function csrf_token(){if(empty($_SESSION['csrf_token']))$_SESSION['csrf_token']=bin2hex(random_bytes(32));return $_SESSION['csrf_token'];}
function verify_csrf(){if(!hash_equals(csrf_token(),(string)($_POST['csrf_token']??''))){http_response_code(403);exit('Permintaan tidak valid. Muat ulang halaman.');}}
