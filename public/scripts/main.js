$(document).ready(()=>{
    const inputUsername = $("#username");
    const inputChannel = $("#room");
    const submit = $("#submit");
    var userBool = inputUsername[0].value?inputUsername[0].value.length>0:false;
    var channelBool = inputChannel[0].value?inputChannel[0].value.length>0:false;
    if(userBool && channelBool){
        submit.prop('disabled', false);
    }else{
        submit.prop('disabled', true);
    }
    inputUsername.on("input", (e)=>{
        e.target.value = e.target.value.trim();
        let value = e.target.value;
        if(value.length>=1 && value.length<=8){
            inputUsername.addClass('is-valid');
            inputUsername.removeClass('is-invalid');
            userBool = true;
        }else{
            inputUsername.addClass('is-invalid');
            inputUsername.removeClass('is-valid');
            userBool = false;
        }
        if(userBool && channelBool){
            submit.prop('disabled', false);
        }else{
            submit.prop('disabled', true);
        }
    })
    inputChannel.on("input", (e)=>{
        let value = e.target.value;
        if(value.length>0){
            inputChannel.addClass('is-valid');
            inputChannel.removeClass('is-invalid');
            channelBool = true;
        }else{
            inputChannel.addClass('is-invalid');
            inputChannel.removeClass('is-valid');
            channelBool = false;
        }
        if(userBool && channelBool){
            submit.prop('disabled', false);
        }else{
            submit.prop('disabled', true);
        }
    })
})