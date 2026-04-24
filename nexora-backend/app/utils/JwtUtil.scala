package utils

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.Date

object JwtUtil {

  private val SECRET = "nexora-secret"
  private val algorithm = Algorithm.HMAC256(SECRET)

  def generateToken(userId: String): String = {
    JWT.create()
      .withSubject(userId)   // ✅ IMPORTANT CHANGE
      .withIssuedAt(new Date())
      .withExpiresAt(new Date(System.currentTimeMillis() + 86400000))
      .sign(algorithm)
  }

  def verifyToken(token: String): Long = {
    val decoded = JWT.require(algorithm).build().verify(token)
    decoded.getSubject.toLong
  }
}