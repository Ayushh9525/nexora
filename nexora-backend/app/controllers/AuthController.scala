package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import repositories.UserRepository
import org.mindrot.jbcrypt.BCrypt
import utils.JwtUtil
import actions.AuthAction

import scala.concurrent.{ExecutionContext, Future}

case class SignupRequest(name: String, email: String, password: String)
case class LoginRequest(email: String, password: String)

@Singleton
class AuthController @Inject()(
                                cc: ControllerComponents,
                                userRepo: UserRepository,
                                authAction: AuthAction
                              )(implicit ec: ExecutionContext)
  extends AbstractController(cc) {

  implicit val signupReads: Reads[SignupRequest] = Json.reads[SignupRequest]
  implicit val loginReads: Reads[LoginRequest] = Json.reads[LoginRequest]

  // ✅ SIGNUP
  def signup = Action.async(parse.json) { request =>
    request.body.validate[SignupRequest].fold(
      _ => Future.successful(BadRequest(Json.obj("message" -> "Invalid JSON"))),
      data => {
        val hashedPassword = BCrypt.hashpw(data.password, BCrypt.gensalt())

        userRepo.createUser(data.name, data.email, hashedPassword).map { _ =>
          Ok(Json.obj("message" -> "User saved in DB 🚀"))
        }
      }
    )
  }

  // ✅ LOGIN
  def login = Action(parse.json) { request =>
    request.body.validate[LoginRequest].fold(
      _ => BadRequest(Json.obj("message" -> "Invalid JSON")),
      data => {

        userRepo.findByEmail(data.email) match {
          case Some((id, email, hashedPassword)) =>
            if (BCrypt.checkpw(data.password, hashedPassword)) {
                val token = JwtUtil.generateToken(id.toString)
              Ok(Json.obj(
                "message" -> "Login successful",
                "token" -> token
              ))
            } else {
              Unauthorized(Json.obj("message" -> "Wrong password"))
            }

          case None =>
            Unauthorized(Json.obj("message" -> "User not found"))
        }
      }

    )
  }

  // ✅ GET PROFILE
  def getProfile = authAction { request =>
    userRepo.getUserProfile(request.userId) match {
      case Some((id, name, email, followers, following)) =>
        Ok(Json.obj(
          "id" -> id,
          "name" -> name,
          "email" -> email,
          "followers" -> followers,
          "following" -> following
        ))
      case None =>
        NotFound(Json.obj("message" -> "User profile not found"))
    }
  }
}
