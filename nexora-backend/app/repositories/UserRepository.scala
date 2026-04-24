package repositories

import javax.inject._
import play.api.db.Database

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class UserRepository @Inject()(db: Database)(implicit ec: ExecutionContext) {

  // ✅ CREATE USER
  def createUser(name: String, email: String, password: String): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "INSERT INTO users(name, email, password) VALUES (?, ?, ?)"
      )
      stmt.setString(1, name)
      stmt.setString(2, email)
      stmt.setString(3, password)
      stmt.executeUpdate()
    }
  }

  // ✅ FIND USER BY EMAIL (LOGIN)
  def findByEmail(email: String): Option[(Long, String, String)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "SELECT id, email, password FROM users WHERE email = ?"
      )
      stmt.setString(1, email)

      val rs = stmt.executeQuery()

      if (rs.next()) {
        Some((
          rs.getLong("id"),
          rs.getString("email"),
          rs.getString("password")
        ))
      } else None
    }
  }

  // ✅ GET DISCOVERABLE USERS (USERS NOT FOLLOWED)
  def getDiscoverableUsers(userId: Long, limit: Int): List[(Long, String)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
        SELECT id, name FROM users 
        WHERE id != ? AND id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = ?
        )
        ORDER BY RANDOM()
        LIMIT ?
        """
      )
      stmt.setLong(1, userId)
      stmt.setLong(2, userId)
      stmt.setInt(3, limit)

      val rs = stmt.executeQuery()
      var users = List[(Long, String)]()
      while (rs.next()) {
        users = users :+ (rs.getLong("id"), rs.getString("name"))
      }
      users
    }
  }

  // ✅ GET USER PROFILE (STATS)
  def getUserProfile(userId: Long): Option[(Long, String, String, Int, Int)] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        """
        SELECT 
          u.id, 
          u.name, 
          u.email,
          (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count
        FROM users u
        WHERE u.id = ?
        """
      )
      stmt.setLong(1, userId)

      val rs = stmt.executeQuery()

      if (rs.next()) {
        Some((
          rs.getLong("id"),
          rs.getString("name"),
          rs.getString("email"),
          rs.getInt("followers_count"),
          rs.getInt("following_count")
        ))
      } else None
    }
  }
}