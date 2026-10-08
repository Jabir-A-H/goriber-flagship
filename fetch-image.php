<?php
header('Content-Type: application/json');

// Get the search query
if (!isset($_GET['q'])) {
    echo json_encode(["error" => "No query provided"]);
    exit;
}

$query = urlencode(trim($_GET['q']));
$url = "https://m.gsmarena.com/res.php3?sSearch=" . $query;

// Use cURL to silently fetch the page from Hostinger's servers
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// Spoof a real browser to bypass GSMArena's anti-bot firewall
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language: en-US,en;q=0.9',
    'Connection: keep-alive',
    'Sec-Fetch-Dest: document',
    'Sec-Fetch-Mode: navigate',
    'Sec-Fetch-Site: none',
    'Upgrade-Insecure-Requests: 1'
]);

$html = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpcode !== 200 || !$html) {
    echo json_encode(["error" => "Target rejected connection", "code" => $httpcode]);
    exit;
}

// Regex to cleanly extract the high-res image
preg_match('/https:\/\/fdn2\.gsmarena\.com\/vv\/bigpic\/[a-zA-Z0-9\-_]+\.jpg/i', $html, $matches);

if (isset($matches[0])) {
    echo json_encode(["url" => $matches[0]]);
} else {
    echo json_encode(["error" => "No image matched"]);
}
?>
