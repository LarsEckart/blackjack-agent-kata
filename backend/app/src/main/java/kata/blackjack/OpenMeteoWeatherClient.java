package kata.blackjack;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class OpenMeteoWeatherClient implements WeatherClient {
    private static final URI LAS_VEGAS_WEATHER_URI = URI.create(
            "https://api.open-meteo.com/v1/forecast"
                    + "?latitude=36.1716"
                    + "&longitude=-115.1391"
                    + "&current=weather_code"
                    + "&timezone=America%2FLos_Angeles"
    );
    private static final Pattern WEATHER_CODE_PATTERN =
            Pattern.compile("\\\"weather_code\\\"\\s*:\\s*(-?\\d+)");

    private final HttpClient httpClient;

    public OpenMeteoWeatherClient() {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build());
    }

    OpenMeteoWeatherClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    @Override
    public WeatherCondition fetchCurrentWeather() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(LAS_VEGAS_WEATHER_URI)
                .timeout(Duration.ofSeconds(3))
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IOException("Weather service returned HTTP " + response.statusCode());
        }

        Matcher matcher = WEATHER_CODE_PATTERN.matcher(response.body());
        if (!matcher.find()) {
            throw new IOException("Weather service response did not contain a weather code");
        }

        try {
            return WeatherCondition.fromWeatherCode(Integer.parseInt(matcher.group(1)));
        } catch (NumberFormatException exception) {
            throw new IOException("Weather service returned an invalid weather code", exception);
        }
    }
}
