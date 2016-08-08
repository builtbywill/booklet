<?php
    
    function page_title($title = ""){
        if ($title != "")
            $title = $title . " - ";
        return $title;
    }
    
    function template_start_open($page_title = ""){
        echo '<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>'. page_title($page_title) .'Booklet - jQuery Plugin</title>';
                
        include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/head.php");
    }
    
    function template_start_close($demos = false){
        echo 
'   </head>
    <body>
';

    	include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/header.php");
        
        if ($demos == true) {
        	include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/aside-demos.php");
        } else {
        	include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/aside.php");
        }
        
        echo '<section id="content" class="sub-content">';
    }
    
    function template_start($page_title = "", $demos = false){
        template_start_open($page_title);
        template_start_close($demos);
    }
    
    function template_end_open(){
        echo '</section>';
        include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/footer.php");
        include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/analytics.php");
        include($_SERVER["DOCUMENT_ROOT"] . "/code/booklet/-/includes/scripts.php");
    }
    
    function template_end_close(){
        echo '
    </body>
</html>';
    }
    
    function template_end(){
        template_end_open();
        template_end_close();
    }
    
    function sample_booklet($id = "mybook"){
        echo 
        '<div id="'. $id .'">
            <div> 
                <h3>Yay, Page 1!</h3>
            </div>
            <div> 
                <h3>Yay, Page 2!</h3>
            </div>
            <div> 
                <h3>Yay, Page 3!</h3>
            </div>
            <div> 
                <h3>Yay, Page 4!</h3>
            </div>
        </div>';
    }
    
?>