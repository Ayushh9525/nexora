package actions

import play.api.mvc._

case class AuthRequest[A](userId: Long, request: Request[A]) extends WrappedRequest[A](request)