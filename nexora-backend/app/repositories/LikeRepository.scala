package repositories

import javax.inject._
import play.api.db.Database

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class LikeRepository @Inject()(db: Database)(implicit ec: ExecutionContext) {

  // ✅ Like post
  def likePost(userId: Long, postId: Long): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "INSERT INTO likes(user_id, post_id) VALUES (?, ?)"
      )
      stmt.setLong(1, userId)
      stmt.setLong(2, postId)
      stmt.executeUpdate()
    }
  }

  // ✅ Unlike post
  def unlikePost(userId: Long, postId: Long): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "DELETE FROM likes WHERE user_id = ? AND post_id = ?"
      )
      stmt.setLong(1, userId)
      stmt.setLong(2, postId)
      stmt.executeUpdate()
    }
  }

  // ✅ Check if liked
  def hasLiked(userId: Long, postId: Long): Boolean = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?"
      )
      stmt.setLong(1, userId)
      stmt.setLong(2, postId)
      val rs = stmt.executeQuery()
      rs.next()
    }
  }

  // ✅ Count likes
  def getLikesCount(postId: Long): Int = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "SELECT COUNT(*) FROM likes WHERE post_id = ?"
      )
      stmt.setLong(1, postId)

      val rs = stmt.executeQuery()
      if (rs.next()) rs.getInt(1) else 0
    }
  }
}