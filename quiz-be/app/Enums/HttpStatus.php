<?php

namespace App\Enums;

enum HttpStatus: int
{
    case UnprocessableEntity = 422;
    case Conflict            = 409;
}
