<?php
/**
 * Plugin Name: CAAP64 Anémomètre
 * Description: Affiche le vent en direct de la station OpenWindMap 986 et les boutons de téléchargement de l'application mobile CAAP64. Shortcodes : [caap64_wind] et [caap64_app appstore="..." testflight="..." play="..." apk="..."].
 * Version: 1.0.0
 * Author: CAAP64
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

function caap64_enqueue_widget_assets() {
    wp_enqueue_style('caap64-wind-widget', plugin_dir_url(__FILE__) . 'wind-widget.css', array(), '1.0.0');
    wp_enqueue_script('caap64-wind-widget', plugin_dir_url(__FILE__) . 'wind-widget.js', array(), '1.0.0', true);
}

function caap64_wind_markup($station) {
    ?>
    <div class="caap64-wind" data-station="<?php echo esc_attr($station); ?>">
      <div class="caap64-wind-top">
        <svg class="caap64-compass" viewBox="0 0 100 100" width="84" height="84" role="img" aria-label="Direction du vent">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.35"/>
          <text x="50" y="13" class="caap64-card" text-anchor="middle">N</text>
          <text x="91" y="54" class="caap64-card" text-anchor="middle">E</text>
          <text x="50" y="95" class="caap64-card" text-anchor="middle">S</text>
          <text x="9" y="54" class="caap64-card" text-anchor="middle">O</text>
          <g class="caap64-arrow"><path d="M50 16 L57 60 L50 54 L43 60 Z"/></g>
        </svg>
        <div class="caap64-wind-nums">
          <div class="caap64-speed"><span class="caap64-avg">—</span><span class="caap64-unit"> km/h</span></div>
          <div class="caap64-range">min <span class="caap64-min">—</span> · max <span class="caap64-max">—</span> km/h</div>
        </div>
      </div>
      <div class="caap64-dir">Vent de <strong class="caap64-dir-label">—</strong> (<span class="caap64-deg">—</span>°) → souffle vers <strong class="caap64-opp">—</strong></div>
      <div class="caap64-bft-line"><span class="caap64-bft">—</span></div>
      <div class="caap64-meta"><span class="caap64-state">—</span> · mesure du <span class="caap64-date">—</span> (<span class="caap64-ago">—</span>)</div>
    </div>
    <?php
}

function caap64_wind_shortcode($atts) {
    $atts = shortcode_atts(array('station' => '986'), $atts, 'caap64_wind');
    caap64_enqueue_widget_assets();
    ob_start();
    caap64_wind_markup($atts['station']);
    return ob_get_clean();
}
add_shortcode('caap64_wind', 'caap64_wind_shortcode');

function caap64_history_markup($station) {
    ?>
    <div class="caap64-history" data-station="<?php echo esc_attr($station); ?>">
      <div class="caap64-history-head">
        <h3>Historique du vent</h3>
        <div class="caap64-periods">
          <button type="button" class="caap64-period" data-ms="3600000">1 h</button>
          <button type="button" class="caap64-period" data-ms="7200000">2 h</button>
          <button type="button" class="caap64-period active" data-ms="86400000">24 h</button>
          <button type="button" class="caap64-period" data-ms="172800000">48 h</button>
          <button type="button" class="caap64-period" data-ms="604800000">7 j</button>
        </div>
      </div>
      <svg class="caap64-chart" viewBox="0 0 600 220" preserveAspectRatio="none" role="img" aria-label="Graphique de l'historique du vent"></svg>
      <div class="caap64-history-status">Chargement de l'historique…</div>
    </div>
    <?php
}

function caap64_history_shortcode($atts) {
    $atts = shortcode_atts(array('station' => '986'), $atts, 'caap64_history');
    caap64_enqueue_widget_assets();
    wp_enqueue_script('caap64-history-widget', plugin_dir_url(__FILE__) . 'wind-history.js', array(), '1.0.0', true);
    ob_start();
    caap64_history_markup($atts['station']);
    return ob_get_clean();
}
add_shortcode('caap64_history', 'caap64_history_shortcode');

function caap64_app_shortcode($atts) {
    $atts = shortcode_atts(
        array(
            'appstore' => '',
            'testflight' => '',
            'play' => '',
            'apk' => '',
        ),
        $atts,
        'caap64_app'
    );
    wp_enqueue_style('caap64-wind-widget', plugin_dir_url(__FILE__) . 'wind-widget.css', array(), '1.0.0');
    ob_start();
    ?>
    <div class="caap64-app">
      <h3>Application CAAP64 Anémomètre</h3>
      <p>Le vent en direct du terrain du CAAP64, sur iPhone et Android.</p>
      <div class="caap64-app-buttons">
        <?php if (!empty($atts['appstore'])) : ?>
          <a class="caap64-btn" href="<?php echo esc_url($atts['appstore']); ?>">App Store (iPhone)</a>
        <?php endif; ?>
        <?php if (!empty($atts['testflight'])) : ?>
          <a class="caap64-btn" href="<?php echo esc_url($atts['testflight']); ?>">TestFlight (iPhone)</a>
        <?php endif; ?>
        <?php if (!empty($atts['play'])) : ?>
          <a class="caap64-btn" href="<?php echo esc_url($atts['play']); ?>">Google Play (Android)</a>
        <?php endif; ?>
        <?php if (!empty($atts['apk'])) : ?>
          <a class="caap64-btn" href="<?php echo esc_url($atts['apk']); ?>">Télécharger l'APK (Android)</a>
        <?php endif; ?>
      </div>
      <div class="caap64-help">
        Android : préférez Google Play (test interne, aucune alerte). Avec l'APK direct : ouvrez le fichier
        téléchargé, autorisez « Installer des applications inconnues » (Réglages → Applications → autoriser cette source),
        et si Play Protect avertit, touchez le nom de l'app en haut de la fenêtre puis « Installer quand même ».
        iPhone : App Store ou TestFlight. Les mesures viennent d'OpenWindMap (station 986), aucune donnée personnelle n'est transmise.
      </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('caap64_app', 'caap64_app_shortcode');
