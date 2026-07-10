$root = 'D:\Amethez'
$port = 4321
$mime = @{
  '.html'=  'text/html; charset=utf-8'
  '.css' =  'text/css'
  '.js'  =  'application/javascript'
  '.json'=  'application/json'
  '.svg' =  'image/svg+xml'
  '.png' =  'image/png'
  '.jpg' =  'image/jpeg'
  '.jpeg'=  'image/jpeg'
  '.ico' =  'image/x-icon'
  '.woff2'= 'font/woff2'
}
$listener = New-Object Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"
while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/').Replace('/', '\'))
  if (Test-Path $file -PathType Leaf) {
    $ext  = [IO.Path]::GetExtension($file).ToLower()
    $type = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    $ctx.Response.ContentType = $type
    $bytes = [IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
