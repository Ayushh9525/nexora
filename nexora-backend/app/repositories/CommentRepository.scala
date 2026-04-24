package repositories

import javax.inject._
import play.api.db.Database

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class CommentRepository @Inject()(db: Database)(implicit ec: ExecutionContext) {

  // ✅ Add comment
  def addComment(userId: Long, postId: Long, comment: String): Future[(Long, java.sql.Timestamp, String)] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
        WITH new_comment AS (
          INSERT INTO comments(user_id, post_id, content) VALUES (?, ?, ?) RETURNING id, created_at, user_id
        )
        SELECT n.id, n.created_at, u.name 
        FROM new_comment n 
        JOIN users u ON n.user_id = u.id
        """
      )
      stmt.setLong(1, userId)
      stmt.setLong(2, postId)
      stmt.setString(3, comment)
      val rs = stmt.executeQuery()
      if (rs.next()) {
        (rs.getLong("id"), rs.getTimestamp("created_at"), rs.getString("name"))
      } else {
        throw new RuntimeException("Failed to add comment")
      }
    }
  }

  // ✅ Get comments for post
  def getComments(postId: Long): List[(Long, Long, String, String, java.sql.Timestamp)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
        SELECT c.id, c.user_id, u.name AS author_name, c.content, c.created_at
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.id ASC
        """
      )
      stmt.setLong(1, postId)

      val rs = stmt.executeQuery()

      var comments = List[(Long, Long, String, String, java.sql.Timestamp)]()

      while (rs.next()) {
        comments = comments :+ (
          rs.getLong("id"),
          rs.getLong("user_id"),
          rs.getString("author_name"),
          rs.getString("content"),
          rs.getTimestamp("created_at")
        )
      }

      comments
    }
  }
}