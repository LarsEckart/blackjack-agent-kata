package kata.blackjack;

public enum WeatherCondition {
    SUNNY,
    CLOUDY,
    RAINY,
    UNKNOWN;

    public static WeatherCondition fromWeatherCode(int code) {
        if (code == 0) {
            return SUNNY;
        }

        if (isCloudCode(code) || isSnowCode(code)) {
            return CLOUDY;
        }

        if (isRainCode(code) || isThunderstormCode(code)) {
            return RAINY;
        }

        return UNKNOWN;
    }

    private static boolean isCloudCode(int code) {
        return code >= 1 && code <= 3 || code == 45 || code == 48;
    }

    private static boolean isRainCode(int code) {
        return code >= 51 && code <= 67 || code >= 80 && code <= 82;
    }

    private static boolean isSnowCode(int code) {
        return code >= 71 && code <= 77 || code >= 85 && code <= 86;
    }

    private static boolean isThunderstormCode(int code) {
        return code >= 95 && code <= 99;
    }
}
