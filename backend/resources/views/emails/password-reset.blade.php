<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Восстановление пароля</title>
</head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
    <p>Здравствуйте{{ $userName ? ', ' . $userName : '' }}!</p>
    <p>Вы запросили восстановление пароля. Перейдите по ссылке, чтобы задать новый пароль:</p>
    <p><a href="{{ $resetUrl }}" style="color: #2563eb;">{{ $resetUrl }}</a></p>
    <p>Ссылка действительна 60 минут. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
</body>
</html>
