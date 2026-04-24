package controllers

import javax.inject._
import play.api.mvc._
import play.api.libs.json._
import repositories.PostRepository
import actions.AuthAction

import scala.concurrent.{ExecutionContext, Future}

case class CreatePostRequest(content: String)

@Singleton
class PostController @Inject()(
                                cc: ControllerComponents,
                                postRepo: PostRepository,
                                authAction: AuthAction
                              )(implicit ec: ExecutionContext)
  extends AbstractController(cc) {

  implicit val reads = Json.reads[CreatePostRequest]

  def createPost = authAction.async(parse.multipartFormData) { request =>
    val userId = request.userId
    val content = request.body.dataParts.get("content").flatMap(_.headOption).getOrElse("")

    val pictureUrl = request.body.file("photo").map { picture =>
      val filename = java.util.UUID.randomUUID().toString + "_" + picture.filename
      val file = new java.io.File(s"public/uploads/$filename")
      picture.ref.moveTo(file, replace = true)
      s"/uploads/$filename"
    }

    if (content.trim.isEmpty && pictureUrl.isEmpty) {
      Future.successful(BadRequest(Json.obj("message" -> "Content or photo is required")))
    } else {
      postRepo.createPost(userId, content, pictureUrl).map { case (id, createdAt, authorName, imgUrl) =>
        Ok(Json.obj(
          "message" -> "Post created", 
          "id" -> id,
          "createdAt" -> createdAt.getTime(),
          "authorName" -> authorName,
          "imageUrl" -> imgUrl
        ))
      }
    }
  }

  def getUpload(file: String) = Action {
    val decodedFile = java.net.URLDecoder.decode(file, "UTF-8")
    val fileToServe = new java.io.File(s"public/uploads/$decodedFile")
    if (fileToServe.exists()) {
      Ok.sendFile(fileToServe, inline = true)
    } else {
      NotFound
    }
  }

  def deletePost(id: Long) = authAction.async { request =>
    postRepo.deletePost(id, request.userId).map { rowsAffected =>
      if (rowsAffected > 0) Ok(Json.obj("message" -> "Post deleted"))
      else NotFound(Json.obj("message" -> "Post not found or unauthorized"))
    }
  }


/*  def feed = authAction { request =>
    val userId = request.userId
    val feedData = postRepo.getFeedForUser(userId)

    Ok(Json.toJson(feedData.map {
      case (uid, content, likes, comments) =>
        Json.obj(
          "userId" -> uid,
          "content" -> content,
          "likes" -> likes,
          "comments" -> comments
        )
    }))
  }*/

  def feed = authAction { request =>

    val userId = request.userId

    val page = request.getQueryString("page").map(_.toInt).getOrElse(1)
    val limit = request.getQueryString("limit").map(_.toInt).getOrElse(5)

    val feedData = postRepo.getFeedForUserPaginated(userId, page, limit)

    Ok(Json.toJson(feedData.map {
      case (pid, uid, content, likes, comments, hasLiked, authorName, createdAt, imageUrl) =>
        Json.obj(
          "id" -> pid,
          "userId" -> uid,
          "content" -> content,
          "likes" -> likes,
          "comments" -> comments,
          "isAuthor" -> (uid == userId),
          "hasLiked" -> hasLiked,
          "authorName" -> authorName,
          "createdAt" -> createdAt.getTime(),
          "imageUrl" -> imageUrl
        )
    }))
  }
}
