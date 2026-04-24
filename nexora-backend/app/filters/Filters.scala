import javax.inject.Inject
import play.api.http.HttpFilters
import play.filters.csrf.CSRFFilter

class Filters @Inject() (
                          // remove CSRF filter
                        ) extends HttpFilters {
  val filters = Seq() // empty → no filters
}