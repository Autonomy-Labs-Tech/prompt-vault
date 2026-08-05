<?php
// IONOS PHP fulfillment webhook for Prompt Vault (Stripe -> Resend).
header('Content-Type: application/json');
function envv($k,$f){$v=getenv($k);return ($v!==false&&$v!=='')?$v:$f;}
$K=envv('STRIPE_SECRET_KEY','sk_live_PLACEHOLDER');
$R=envv('RESEND_API_KEY','re_PLACEHOLDER_PfBLYPcec4W9byGcGFGVtKiY');
$FROM='Prompt Vault <hello@autonomylabsweb.tech>';
$i=file_get_contents('php://input');$e=json_decode($i,true);$t=$e['type']??'';
if(!in_array($t,['checkout.session.completed','payment_intent.succeeded'],true)){echo json_encode(['ok'=>true,'ignored'=>$t]);exit;}
$o=$e['data']['object']??[];$em=$o['customer_details']['email']??$o['customer_email']??'';
if(!$em){echo json_encode(['ok'=>false,'reason'=>'no email']);exit;}
$cats=[
 'Marketing copy'=>['Write an Instagram caption for [product] aimed at [audience]. Tone: friendly, expert, with a CTA.','Turn this [feature list] into a 3-part LinkedIn post that ends with a question.','Write a 150-word intro email for [service].'],
 'Email & replies'=>['Write a polite follow-up to [prospect] who hasn\'t replied in a week.','Draft a reply to this customer message [PASTE] that is warm and solves the issue.'],
 'Admin & ops'=>['Turn this into a one-page project plan for [task]: goal, steps, timeline, owner.','Write a short SOP for [recurring task] so I can delegate it.'],
 'Brainstorming'=>['Give me 20 content ideas for [niche] that help a beginner feel confident.','Suggest 5 names for [new product] with a one-line description each.']];
$h='<h3>Your 40 Prompts</h3>';
foreach($cats as $c=>$ps){$h.='<p><strong>'.htmlspecialchars($c).'</strong></p><ul>';foreach($ps as $p)$h.='<li>'.htmlspecialchars($p).'</li>';$h.='</ul>';}
$body='<p>Thanks for your purchase!</p>'.$h.'<p>Keep this email — it is your lifetime access. Reply and we\'ll resend it.</p>';
$pl=json_encode(['from'=>$FROM,'to'=>[$em],'subject'=>'Your Prompt Vault — 40 Reusable Prompts is ready','html'=>$body]);
$ctx=stream_context_create(['http'=>['method'=>'POST','header'=>"Authorization: Bearer $R\r\nContent-Type: application/json\r\n",'content'=>$pl,'ignore_PLACEHOLDER'=>true]]);
@file_get_contents('https://api.resend.com/emails',false,$ctx);
echo json_encode(['ok'=>true]);
