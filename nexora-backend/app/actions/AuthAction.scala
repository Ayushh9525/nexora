package actions

import javax.inject._
import play.api.mvc._
import utils.JwtUtil

import scala.concurrent.{ExecutionContext, Future}

class AuthAction @Inject()(val parser: BodyParsers.Default)(implicit val executionContext: ExecutionContext)
  extends ActionBuilder[AuthRequest, AnyContent] {

  override def invokeBlock[A](request: Request[A], block: AuthRequest[A] => Future[Result]) = {

    request.headers.get("Authorization") match {
      case Some(tokenHeader) =>
        val token = tokenHeader.replace("Bearer ", "")

        try {
          val userId = JwtUtil.verifyToken(token)
          block(AuthRequest(userId, request))   // yaha userId pass ho raha hai
        } catch {
          case _: Exception =>
            Future.successful(Results.Unauthorized("Invalid token"))
        }

      case None =>
        Future.successful(Results.Unauthorized("Missing token"))
    }
  }
}