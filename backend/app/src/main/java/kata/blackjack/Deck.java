package kata.blackjack;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class Deck {

    private final List<Card> cards = new ArrayList<>();

    public Deck() {
        var cardValues = List.of("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");
        var suits = List.of("spades", "diamonds", "hearts", "clubs");
        for (String suit : suits) {
            for (String cardValue : cardValues) {
                cards.add(new Card(suit, cardValue));
            }
        }
        Collections.shuffle(cards);
    }

}
