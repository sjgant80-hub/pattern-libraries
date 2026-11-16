// pattern-libraries · src/clinc.mjs — LIBRARY 4, ROUTING ACROSS TEN DOMAINS WITH OUT-OF-SCOPE (SEAL 8): CLINC150
// (Larson et al., EMNLP 2019; github.com/clinc/oos-eval at 828f809, CC BY 3.0). 150 intents in 10 domains, one route
// each, and one out-of-scope flag for the queries none of them covers. The router is src/router.mjs. Pure and total.
import R from './router.mjs';

// domains.json at the pinned commit, in its own order (the loader refuses a file that differs)
export const DOMAINS = Object.freeze({
  banking: Object.freeze(['freeze_account', 'routing', 'pin_change', 'bill_due', 'pay_bill', 'account_blocked', 'interest_rate', 'min_payment', 'bill_balance', 'transfer', 'order_checks', 'balance', 'spending_history', 'transactions', 'report_fraud']),
  credit_cards: Object.freeze(['replacement_card_duration', 'expiration_date', 'damaged_card', 'improve_credit_score', 'report_lost_card', 'card_declined', 'credit_limit_change', 'apr', 'redeem_rewards', 'credit_limit', 'rewards_balance', 'application_status', 'credit_score', 'new_card', 'international_fees']),
  kitchen_and_dining: Object.freeze(['food_last', 'confirm_reservation', 'how_busy', 'ingredients_list', 'calories', 'nutrition_info', 'recipe', 'restaurant_reviews', 'restaurant_reservation', 'meal_suggestion', 'restaurant_suggestion', 'cancel_reservation', 'ingredient_substitution', 'cook_time', 'accept_reservations']),
  home: Object.freeze(['what_song', 'play_music', 'todo_list_update', 'reminder', 'reminder_update', 'calendar_update', 'order_status', 'update_playlist', 'shopping_list', 'calendar', 'next_song', 'order', 'todo_list', 'shopping_list_update', 'smart_home']),
  auto_and_commute: Object.freeze(['current_location', 'oil_change_when', 'oil_change_how', 'uber', 'traffic', 'tire_pressure', 'schedule_maintenance', 'gas', 'mpg', 'distance', 'directions', 'last_maintenance', 'gas_type', 'tire_change', 'jump_start']),
  travel: Object.freeze(['plug_type', 'travel_notification', 'translate', 'flight_status', 'international_visa', 'timezone', 'exchange_rate', 'travel_suggestion', 'travel_alert', 'vaccines', 'lost_luggage', 'book_flight', 'book_hotel', 'carry_on', 'car_rental']),
  utility: Object.freeze(['weather', 'alarm', 'date', 'find_phone', 'share_location', 'timer', 'make_call', 'calculator', 'definition', 'measurement_conversion', 'flip_coin', 'spelling', 'time', 'roll_dice', 'text']),
  work: Object.freeze(['pto_request_status', 'next_holiday', 'insurance_change', 'insurance', 'meeting_schedule', 'payday', 'taxes', 'income', 'rollover_401k', 'pto_balance', 'pto_request', 'w2', 'schedule_meeting', 'direct_deposit', 'pto_used']),
  small_talk: Object.freeze(['who_made_you', 'meaning_of_life', 'who_do_you_work_for', 'do_you_have_pets', 'what_are_your_hobbies', 'fun_fact', 'what_is_your_name', 'where_are_you_from', 'goodbye', 'thank_you', 'greeting', 'tell_joke', 'are_you_a_bot', 'how_old_are_you', 'what_can_i_ask_you']),
  meta: Object.freeze(['change_speed', 'user_name', 'whisper_mode', 'yes', 'change_volume', 'no', 'change_language', 'repeat', 'change_accent', 'cancel', 'sync_device', 'change_user_name', 'change_ai_name', 'reset_settings', 'maybe']),
});
export const INTENTS = Object.freeze(Object.values(DOMAINS).flat());
// seal 8: SHA-256 order (seal 4), meter 1,500, seed 4,200, nine batches of 2,000, every batch spent (seal 7's merged tail)
export const SCHEDULE = Object.freeze({ meter: 1500, seed: 4200, batch: 2000, salt: 'clinc150:', hash: 'sha256', tail: 'merge' });
export const METER_BAR = 0.8;

const K = R.routerFor({
  intents: INTENTS, key: 'clinc:', oos: 'oos', oosTask: 'out-of-scope', oosSay: 'Out of scope: none of the 150 teams',
  job: 'routing across ten domains', data: 'CLINC150 (CC BY 3.0)',
  what: 'the words of one request to a general assistant: banking, credit cards, travel, the home, work and more',
});
export const { ROUTES, NAMEWORDS, OOS, TASKS, say, units, baseline, pick, route, keywordRoute, routeOn, read, DOMAIN } = K;
/** domainOf(route) → the domain a route belongs to, or null */
export const domainOf = (task) => Object.keys(DOMAINS).find((d) => DOMAINS[d].some((n) => R.idOf(n) === task)) || null;

export default { DOMAINS, INTENTS, SCHEDULE, METER_BAR, ...K, domainOf };
