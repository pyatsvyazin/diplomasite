<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Подтверждение почты</title>
</head>
<body style="font-family: sans-serif; line-height: 1.5; color: #333;">
    <p>Здравствуйте{{ $userName ? ', ' . $userName : '' }}!</p>
    <p>Подтвердите адрес почты, перейдя по ссылке:</p>
    <p><a href="{{ $verifyUrl }}" style="color: #2563eb;">Подтвердить почту</a></p>
    <p>Ссылка действительна 60 минут. Если вы не регистрировались, проигнорируйте это письмо.</p>
</body>
</html>
