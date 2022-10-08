"use strict";

function Voice(audioManager, sample, speed, volume) {
  this.sample = sample;
  this.speed = speed*(sample.buffer.sampleRate/audioManager.sample_rate);
  this.volume = volume;
  this.position = 0;
  audioManager.voices.push(this);
}

function MusicCallback(audioManager) {
  this.buffer = 0;
  this.length = 10000;
  this.audioManager = audioManager;
  audioManager.musicCallbacks.push(this);
}

MusicCallback.prototype.reset = function() {
  this.buffer = 0;
}

MusicCallback.prototype.remove = function() {
  for (let x in audioManager.musicCallbacks) {
    if (audioManager.musicCallbacks[x]===this) {
      audioManager.musicCallbacks.splice(audioManager.musicCallbacks[x], 1);
    }
  }
}

MusicCallback.prototype.setBPM = function(tempo) {
  this.length = audioManager.sample_rate*60/tempo;
}

MusicCallback.prototype.setCallback = function(callback) {
  this.callback = callback;
}

function AudioManager() {
  this.sample_rate = 44100;
  this.buffers_max = 3;
  this.buffers_active = 0;
  this.buffer_length = 4096;
  this.buffer_music = 0;
  this.ctx = new AudioContext();
  this.voices = [];
  this.musicCallbacks = [];
  this.start = 0;
  this.pos = 0;

  setInterval(this.pump.bind(this), Math.max(((this.buffer_length/this.sample_rate)*1000)-1, 1));
}

AudioManager.prototype.pump = function() {
  while (this.buffers_active<this.buffers_max) {
    let buf = this.ctx.createBuffer(2, this.buffer_length, this.sample_rate);
    let audio_left = buf.getChannelData(0);
    let audio_right = buf.getChannelData(1);
    for (let n = 0; n<this.buffer_length; n++) {
      audio_left[n] = 0;
      audio_right[n] = 0;
    }

    let audio_pos = 0;
    while (audio_pos<this.buffer_length) {
      let left = 100000000;
      for (let x in this.musicCallbacks) {
        let v = this.musicCallbacks[x];
        left = Math.min(v.length-v.buffer, left);
      }

      left = Math.min(this.buffer_length-audio_pos, left);
      for (let x in this.voices) {
        let v = this.voices[x];
        if (v.sample && v.sample.buffer) {
          let audio_sample = v.sample.buffer.getChannelData(0);
          let length = v.sample.buffer.length;
          for (let n = audio_pos; n<audio_pos+left && v.position<length; n++) {
            audio_left[n] += audio_sample[Math.floor(v.position)]*v.volume;
            audio_right[n] += audio_sample[Math.floor(v.position)]*v.volume;
            v.position += v.speed;
          }
        }
      }

      audio_pos += left;
      for (let x in this.musicCallbacks) {
        let v = this.musicCallbacks[x];
        v.buffer += left;
        if (v.buffer>=v.length) {
          v.buffer = 0;
          v.callback(v);
        }
      }
    }

    let remove = [];
    for (let x in this.voices) {
      let v = this.voices[x];
      let length = v.sample.buffer.length;
      if (v.position>=length) {
        remove.push(x);
      }
    }

    for (let x in remove) {
      this.voices.splice(remove[x], 1);
    }

    this.pos += this.buffer_length;

    let source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.connect(this.ctx.destination);
    source.onended = (function() {
      this.buffers_active--;
      // this creates endless stack traces and I'm afraid these could hook up memory
      // this.pump();
    }).bind(this);

    source.start(this.start);
    this.start += buf.duration;
    this.buffers_active++;
  }
}

AudioManager.prototype.load_sample = function(file, color) {
  // TODO: sample as prototyped object?
  let sample = {};
  sample.file = file;
  sample.color = color;
  /*let response = fetch_sync(file, "arraybuffer", function(fetched, response) {
    if (fetched) {
      ctx.decodeAudioData(response, function(buffer) {
        sample.buffer = buffer;
      });
    }
  });*/

  return sample;
}

