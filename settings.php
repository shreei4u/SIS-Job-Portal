<?php
/**
 * Shield Job Portal - Site Settings & Pricing API Endpoint
 */

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? 'get';
$body = getJsonBody();
$db = getDB();

if (!$db) {
    jsonError('Database connection not established.', 500);
}

// ------------------------------------------------------------------------
// 1. Get All Public Site Settings & Pricing
// ------------------------------------------------------------------------
if ($action === 'get') {
    $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    jsonSuccess([
        'settings' => [
            'heroEyebrow' => $settings['hero_eyebrow'] ?? '',
            'heroTitle' => $settings['hero_title'] ?? '',
            'heroLead' => $settings['hero_lead'] ?? '',
            'moto' => $settings['moto'] ?? '',
            'footerText' => $settings['footer_text'] ?? '',
            'logoUrl' => $settings['logo_url'] ?? '',
            'bannerUrl' => $settings['banner_url'] ?? '',
            'social' => [
                'facebook' => $settings['social_facebook'] ?? '',
                'twitter' => $settings['social_twitter'] ?? '',
                'linkedin' => $settings['social_linkedin'] ?? '',
                'instagram' => $settings['social_instagram'] ?? '',
                'youtube' => $settings['social_youtube'] ?? '',
            ],
            'contact' => [
                'email' => $settings['contact_email'] ?? '',
                'phone' => $settings['contact_phone'] ?? '',
                'address' => $settings['contact_address'] ?? '',
            ]
        ],
        'pricing' => [
            'atsBoost' => intval($settings['price_ats_boost'] ?? 299),
            'employerNormalPosting' => intval($settings['price_employer_normal'] ?? 999),
            'employerHiringAssistant' => intval($settings['price_employer_assist'] ?? 4999),
            'premiumSubscription' => intval($settings['price_premium_sub'] ?? 499),
        ]
    ]);
}

// ------------------------------------------------------------------------
// 2. Save Site Content Settings (Admin)
// ------------------------------------------------------------------------
if ($action === 'save_settings') {
    $user = requireRole('admin');

    $map = [
        'hero_eyebrow' => $body['heroEyebrow'] ?? '',
        'hero_title' => $body['heroTitle'] ?? '',
        'hero_lead' => $body['heroLead'] ?? '',
        'moto' => $body['moto'] ?? '',
        'footer_text' => $body['footerText'] ?? '',
        'logo_url' => $body['logoUrl'] ?? '',
        'banner_url' => $body['bannerUrl'] ?? '',
        'social_facebook' => $body['social']['facebook'] ?? '',
        'social_twitter' => $body['social']['twitter'] ?? '',
        'social_linkedin' => $body['social']['linkedin'] ?? '',
        'social_instagram' => $body['social']['instagram'] ?? '',
        'social_youtube' => $body['social']['youtube'] ?? '',
        'contact_email' => $body['contact']['email'] ?? '',
        'contact_phone' => $body['contact']['phone'] ?? '',
        'contact_address' => $body['contact']['address'] ?? '',
    ];

    $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    foreach ($map as $k => $v) {
        $stmt->execute([$k, $v, $v]);
    }

    logActivityDB("Admin updated site content and settings.");
    jsonSuccess([], 'Site settings saved successfully.');
}

// ------------------------------------------------------------------------
// 3. Save Platform Pricing (Admin)
// ------------------------------------------------------------------------
if ($action === 'save_pricing') {
    $user = requireRole('admin');

    $map = [
        'price_ats_boost' => strval(intval($body['atsBoost'] ?? 299)),
        'price_employer_normal' => strval(intval($body['employerNormalPosting'] ?? 999)),
        'price_employer_assist' => strval(intval($body['employerHiringAssistant'] ?? 4999)),
        'price_premium_sub' => strval(intval($body['premiumSubscription'] ?? 499)),
    ];

    $stmt = $db->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    foreach ($map as $k => $v) {
        $stmt->execute([$k, $v, $v]);
    }

    logActivityDB("Admin updated platform pricing.");
    jsonSuccess([], 'Platform pricing updated successfully.');
}

jsonError('Invalid action specified.');
