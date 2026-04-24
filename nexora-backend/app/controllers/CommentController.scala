package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import repositories.CommentRepository
import actions.AuthAction

import scala.concurrent.{ExecutionContext, Future}

case class CommentRequest(comment: String)

@Singleton
class CommentController @Inject()(
                                   cc: ControllerComponents,
                                   commentRepo: CommentRepository,
                                   authAction: AuthAction
                                 )(implicit ec: ExecutionContext)
  extends AbstractController(cc) {

  implicit val reads = Json.reads[CommentRequest]

  // ✅ Add comment
  def addComment(postId: Long) = authAction.async(parse.json) { request =>
    request.body.validate[CommentRequest].fold(
      _ => Future.successful(BadRequest("Invalid JSON")),
      data => {
        val userId = request.userId

        commentRepo.addComment(userId, postId, data.comment).map { case (id, createdAt, authorName) =>
          Ok(Json.obj(
            "message" -> "Comment added 💬",
            "id" -> id,
            "createdAt" -> createdAt.getTime(),
            "authorName" -> authorName
          ))
        }
      }
    )
  }

  // ✅ Get comments
  def getComments(postId: Long) = Action {
    val comments = commentRepo.getComments(postId)

    Ok(Json.toJson(comments.map { case (id, uid, authorName, content, createdAt) =>
      Json.obj(
        "id" -> id,
        "userId" -> uid,
        "authorName" -> authorName,
        "comment" -> content,
        "createdAt" -> createdAt.getTime()
      )
    }))
  }
}