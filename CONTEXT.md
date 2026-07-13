# Blackjack

This context describes blackjack play for one Player against one Dealer. A Game session can contain multiple Rounds and carries a Bankroll across them; a Weather condition may be shown as setting context.

## Session and money

**Game session**:
An ongoing period of play associated with one Player, allowing multiple Rounds while carrying the Player's Bankroll forward.
_Avoid_: game, account, connection

**Round**:
One contest between the Player and the Dealer, from the Initial deal through the Outcome.
_Avoid_: Game, hand, game round

**Bankroll**:
Money available to the Player for placing Bets in future Rounds.
_Avoid_: balance, account, funds

**Bet**:
The amount removed from the Bankroll when a Round starts; the current Round bet is $5.
_Avoid_: stake, wager amount

**Round settlement**:
The adjustment to the Bankroll after an Outcome: a win returns the Bet and equal winnings, a Push returns the Bet, and a loss returns nothing.
_Avoid_: payout, refund

## Hands and roles

**Player**:
The participant who chooses Actions and tries to finish with a higher valid Score than the Dealer.
_Avoid_: user, gambler

**Dealer**:
The opposing participant who plays automatically after the Player stands and follows the Dealer play rule.
_Avoid_: house, computer

**Player hand**:
The cards held by the Player during a Round.
_Avoid_: player cards

**Dealer hand**:
The cards held by the Dealer during a Round.
_Avoid_: dealer cards

**Deck**:
The set of Cards available to draw during a Round.
_Avoid_: card pool, shoe

**Card**:
A playing card identified by a rank and a suit.
_Avoid_: item, tile

## Play

**Initial deal**:
The opening deal of two Cards to the Player and two Cards to the Dealer at the start of a Round.
_Avoid_: setup, initialization

**Action**:
A choice available to the Player while a Round is in play: Hit or Stand.
_Avoid_: move, command

**Hit**:
The Player's Action of taking one additional Card.
_Avoid_: draw, take

**Stand**:
The Player's Action of taking no more Cards and handing play to the Dealer.
_Avoid_: hold, pass

**Dealer play**:
The phase after the Player stands in which the Dealer draws until the Dealer's Score is at least 17.
_Avoid_: automatic turn, dealer turn

**Score**:
The value of a Player hand or Dealer hand, counting an Ace as 1 or 11 as needed to avoid a Bust when possible.
_Avoid_: total, points

**Blackjack**:
A Player hand or Dealer hand with exactly two Cards and a Score of 21.
_Avoid_: natural 21, perfect hand

**Bust**:
A hand with a Score greater than 21.
_Avoid_: break, overflow

## Outcomes and setting

**Outcome**:
The final result of a Round: Player win, Dealer win, Push, Player bust, or Dealer bust.
_Avoid_: result code, status

**Push**:
An Outcome in which the Player and Dealer have equal valid Scores.
_Avoid_: tie game, draw

**Weather condition**:
Optional setting context shown with a Round: Sunny, Cloudy, Rainy, or Unknown. It does not change blackjack rules.
_Avoid_: forecast, climate
