package kata.blackjack;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;

public class WeatherService {
    private static final Logger LOGGER = Logger.getLogger(WeatherService.class.getName());
    private static final Duration CACHE_DURATION = Duration.ofMinutes(1);

    private final WeatherClient weatherClient;
    private final Clock clock;
    private CachedWeather cachedWeather;

    public WeatherService(WeatherClient weatherClient) {
        this(weatherClient, Clock.systemUTC());
    }

    WeatherService(WeatherClient weatherClient, Clock clock) {
        this.weatherClient = Objects.requireNonNull(weatherClient);
        this.clock = Objects.requireNonNull(clock);
    }

    public synchronized WeatherCondition getCurrentWeather() {
        Instant now = clock.instant();
        if (cachedWeather != null && now.isBefore(cachedWeather.fetchedAt().plus(CACHE_DURATION))) {
            LOGGER.info(() -> "Using cached weather: " + cachedWeather.condition());
            return cachedWeather.condition();
        }

        LOGGER.info("Fetching current weather");
        try {
            WeatherCondition condition = cache(Objects.requireNonNull(
                    weatherClient.fetchCurrentWeather(),
                    "Weather client returned no condition"
            ));
            LOGGER.info(() -> "Current weather: " + condition);
            return condition;
        } catch (IOException | RuntimeException exception) {
            LOGGER.log(Level.WARNING, "Could not fetch current weather", exception);
            throw new IllegalStateException("Could not fetch current weather", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            LOGGER.log(Level.WARNING, "Could not fetch current weather because the request was interrupted", exception);
            throw new IllegalStateException("Could not fetch current weather", exception);
        }
    }

    private WeatherCondition cache(WeatherCondition condition) {
        cachedWeather = new CachedWeather(condition, clock.instant());
        return condition;
    }

    private record CachedWeather(WeatherCondition condition, Instant fetchedAt) {
    }
}
