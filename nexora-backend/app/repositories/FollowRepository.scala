package repositories

import javax.inject._
import play.api.db.Database

import scala.concurrent.{ExecutionContext, Future}

@Singleton
class FollowRepository @Inject()(db: Database)(implicit ec: ExecutionContext) {

  // ✅ Follow
  def followUser(followerId: Long, followingId: Long): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "INSERT INTO follows(follower_id, following_id) VALUES (?, ?)"
      )
      stmt.setLong(1, followerId)
      stmt.setLong(2, followingId)
      stmt.executeUpdate()
    }
  }

  // ✅ Unfollow
  def unfollowUser(followerId: Long, followingId: Long): Future[Int] = Future {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
      )
      stmt.setLong(1, followerId)
      stmt.setLong(2, followingId)
      stmt.executeUpdate()
    }
  }

  // ✅ Get following list
  def getFollowing(userId: Long): List[Long] = {
    db.withConnection { conn =>
      val stmt = conn.prepareStatement(
        "SELECT following_id FROM follows WHERE follower_id = ?"
      )
      stmt.setLong(1, userId)

      val rs = stmt.executeQuery()

      var list = List[Long]()
      while (rs.next()) {
        list = list :+ rs.getLong("following_id")
      }

      list
    }
  }
}