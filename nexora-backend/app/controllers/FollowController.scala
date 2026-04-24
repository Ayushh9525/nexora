package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import repositories.FollowRepository
import actions.AuthAction

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class FollowController @Inject()(
                                  cc: ControllerComponents,
                                  followRepo: FollowRepository,
                                  userRepo: repositories.UserRepository,
                                  authAction: AuthAction
                                )(implicit ec: ExecutionContext)
  extends AbstractController(cc) {

  // ✅ Follow
  def follow(userIdToFollow: Long) = authAction.async { request =>
    val userId = request.userId

    if (userId == userIdToFollow) {
      Future.successful(BadRequest(Json.obj("message" -> "Cannot follow yourself")))
    } else {
      followRepo.followUser(userId, userIdToFollow).map { _ =>
        Ok(Json.obj("message" -> "Followed 👥"))
      }.recover {
        case _ => BadRequest(Json.obj("message" -> "Already following"))
      }
    }
  }

  // ✅ Unfollow
  def unfollow(userIdToUnfollow: Long) = authAction.async { request =>
    val userId = request.userId

    followRepo.unfollowUser(userId, userIdToUnfollow).map { _ =>
      Ok(Json.obj("message" -> "Unfollowed"))
    }
  }

  // ✅ Discover Users
  def discover = authAction { request =>
    val userId = request.userId
    val limit = request.getQueryString("limit").map(_.toInt).getOrElse(10)
    
    val users = userRepo.getDiscoverableUsers(userId, limit)
    
    Ok(Json.toJson(users.map { case (id, name) =>
      Json.obj(
        "id" -> id,
        "name" -> name
      )
    }))
  }

  // ✅ Get Followers
  def getFollowers = authAction { request =>
    val users = userRepo.getFollowers(request.userId)
    Ok(Json.toJson(users.map { case (id, name) =>
      Json.obj("id" -> id, "name" -> name)
    }))
  }

  // ✅ Get Following
  def getFollowing = authAction { request =>
    val users = userRepo.getFollowing(request.userId)
    Ok(Json.toJson(users.map { case (id, name) =>
      Json.obj("id" -> id, "name" -> name)
    }))
  }
}