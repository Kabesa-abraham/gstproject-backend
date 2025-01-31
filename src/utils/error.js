export const errorHandler = (statusCode,message) =>{  //ce middleware va aussi permettre de gérer l'erreur
    const error = new Error() //j'utilise la classe Error de js pour crée une erreur
    error.statusCode = statusCode;
    error.message = message
    return error
}
