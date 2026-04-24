package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import repositories.LikeRepository
import actions.AuthAction

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class LikeController @Inject()(
                                cc: ControllerComponents,
                                likeRepo: LikeRepository,
                                authAction: AuthAction
                              )(implicit ec: ExecutionContext)
  extends AbstractController(cc) {

  // ✅ Toggle Like API
  def toggleLike(postId: Long) = authAction.async { request =>
    val userId = request.userId

    if (likeRepo.hasLiked(userId, postId)) {
      likeRepo.unlikePost(userId, postId).map { _ =>
        Ok(Json.obj("message" -> "Post unliked", "liked" -> false))
      }
    } else {
      likeRepo.likePost(userId, postId).map { _ =>
        Ok(Json.obj("message" -> "Post liked ❤️", "liked" -> true))
      }
    }
  }

  // ✅ Get likes count
  def getLikes(postId: Long) = Action {
    val count = likeRepo.getLikesCount(postId)
    Ok(Json.obj("likes" -> count))
  }
}