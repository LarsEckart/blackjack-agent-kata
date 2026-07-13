package kata.blackjack;

import java.io.IOException;

public interface WeatherClient {
    WeatherCondition fetchCurrentWeather() throws IOException, InterruptedException;
}
