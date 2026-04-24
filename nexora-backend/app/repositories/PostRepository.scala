package repositories

import javax.inject._
import play.api.db.Database

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class PostRepository @Inject()(db: Database)(implicit ec: ExecutionContext) {

  def createPost(userId: Long, content: String, imageUrl: Option[String]): Future[(Long, java.sql.Timestamp, String, Option[String])] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
        WITH new_post AS (
          INSERT INTO posts(user_id, content, image_url) VALUES (?, ?, ?) RETURNING id, created_at, user_id, image_url
        )
        SELECT n.id, n.created_at, u.name, n.image_url 
        FROM new_post n 
        JOIN users u ON n.user_id = u.id
        """
      )
      stmt.setLong(1, userId)
      stmt.setString(2, content)
      stmt.setString(3, imageUrl.orNull)
      val rs = stmt.executeQuery()
      if (rs.next()) {
        (rs.getLong("id"), rs.getTimestamp("created_at"), rs.getString("name"), Option(rs.getString("image_url")))
      } else {
        throw new RuntimeException("Failed to create post")
      }
    }
  }

  def deletePost(postId: Long, userId: Long): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "DELETE FROM posts WHERE id = ? AND user_id = ?"
      )
      stmt.setLong(1, postId)
      stmt.setLong(2, userId)
      stmt.executeUpdate()
    }
  }

  def getAllPosts(): List[(Long, String)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement("SELECT user_id, content FROM posts")
      val rs = stmt.executeQuery()

      var posts = List[(Long, String)]()

      while (rs.next()) {
        posts = posts :+ (rs.getLong("user_id"), rs.getString("content"))
      }

      posts
    }
  }

  def getFeed(): List[(Long, Long, String, Int, Int)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
      SELECT
        p.id,
        p.user_id,
        p.content,
        COUNT(DISTINCT l.id) AS likes,
        COUNT(DISTINCT c.id) AS comments
      FROM posts p
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id
      ORDER BY p.id DESC
      """
      )

      val rs = stmt.executeQuery()

      var feed = List[(Long, Long, String, Int, Int)]()

      while (rs.next()) {
        feed = feed :+ (
          rs.getLong("id"),
          rs.getLong("user_id"),
          rs.getString("content"),
          rs.getInt("likes"),
          rs.getInt("comments")
        )
      }

      feed
    }
  }

  def getFeedForUser(userId: Long): List[(Long, Long, String, Int, Int, Boolean, String, java.sql.Timestamp, Option[String])] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
      SELECT
        p.id,
        p.user_id,
        p.content,
        COUNT(DISTINCT l.id) AS likes,
        COUNT(DISTINCT c.id) AS comments,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS hasLiked,
        u.name AS author_name,
        p.created_at,
        p.image_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.user_id = ? OR p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      )
      GROUP BY p.id, u.name
      ORDER BY p.id DESC
      """
      )

      stmt.setLong(1, userId)
      stmt.setLong(2, userId)
      stmt.setLong(3, userId)

      val rs = stmt.executeQuery()

      var feed = List[(Long, Long, String, Int, Int, Boolean, String, java.sql.Timestamp, Option[String])]()

      while (rs.next()) {
        feed = feed :+ (
          rs.getLong("id"),
          rs.getLong("user_id"),
          rs.getString("content"),
          rs.getInt("likes"),
          rs.getInt("comments"),
          rs.getBoolean("hasLiked"),
          rs.getString("author_name"),
          rs.getTimestamp("created_at"),
          Option(rs.getString("image_url"))
        )
      }

      feed
    }
  }

  def getFeedForUserPaginated(userId: Long, page: Int, limit: Int): List[(Long, Long, String, Int, Int, Boolean, String, java.sql.Timestamp, Option[String])] = {
    val offset = (page - 1) * limit

    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
      SELECT
        p.id,
        p.user_id,
        p.content,
        COUNT(DISTINCT l.id) AS likes,
        COUNT(DISTINCT c.id) AS comments,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS hasLiked,
        u.name AS author_name,
        p.created_at,
        p.image_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.user_id = ? OR p.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      )
      GROUP BY p.id, u.name
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      """
      )

      stmt.setLong(1, userId)
      stmt.setLong(2, userId)
      stmt.setLong(3, userId)
      stmt.setInt(4, limit)
      stmt.setInt(5, offset)

      val rs = stmt.executeQuery()

      var feed = List[(Long, Long, String, Int, Int, Boolean, String, java.sql.Timestamp, Option[String])]()

      while (rs.next()) {
        feed = feed :+ (
          rs.getLong("id"),
          rs.getLong("user_id"),
          rs.getString("content"),
          rs.getInt("likes"),
          rs.getInt("comments"),
          rs.getBoolean("hasLiked"),
          rs.getString("author_name"),
          rs.getTimestamp("created_at"),
          Option(rs.getString("image_url"))
        )
      }

      feed
    }
  }

}