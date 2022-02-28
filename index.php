<?php 

/**
 * Plugin Name: Advanced Archive
 * Description: A Simple plugin for improve your archive experience
 * Version: 1.0.0
 * Author: Facundo Gamond
 * Author URI: https://facundogamond.com.ar
 * Text Domain: advancedarchive
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) exit; // Exit if accessed directly

class AdvancedArchive{
    function __construct()
    {
        add_action('admin_menu', array($this, 'ourMenu'));
    }

    function ourMenu()
    {
        $mainPageHook = add_menu_page('Advanced Archive', 'Advanced Archive', 'manage_options', 'advancedarchive', array($this, 'advancedArchivePage'), 'dashicons-superhero-alt', 100);
        add_submenu_page('ourwordfilter', 'Advanced Archive', 'Advanced Archive', 'manage_options', 'advancedarchive', array($this, 'advancedArchivePage'));
        add_action("load-{$mainPageHook}", array($this, 'mainPageAssets'));
    }

    function mainPageAssets()
    {
        wp_enqueue_style('filterAdminCss', plugin_dir_url(__FILE__) . 'styles.css');
    }

    function advancedArchivePage()
    { ?>
        <div class="wrap">
            <h1>Advanced Archive</h1>
            <p>This is a simple wordpress plugin to get a full archive experience.</p>
            <p>Just paste in your post/page text editor this shortcode: [advancedarchive]</p>
            <h2>Features</h2>
            <ul>
                <li>Ajax data return (no reload required)</li>
                <li>filters by Taxonomies</li>
                <li>Pagination</li>
                <li>Search Box</li>
                <li>URL params for easy share</li>
            </ul>
        </div>
    <?php }
}

$advancedArchive = new AdvancedArchive();
?>