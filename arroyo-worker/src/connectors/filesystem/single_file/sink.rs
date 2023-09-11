use std::{marker::PhantomData, path::Path};

use arroyo_macro::{process_fn, StreamNode};
use arroyo_rpc::OperatorConfig;
use arroyo_types::{Data, Key, Record};
use serde::Serialize;
use tokio::{
    fs::{self, File, OpenOptions},
    io::AsyncWriteExt,
};

use crate::engine::Context;

use super::SingleFileTable;

#[derive(StreamNode)]
pub struct FileSink<K: Key, T: Data + Serialize> {
    output_path: String,
    file: Option<File>,
    _phantom: PhantomData<(K, T)>,
}

#[process_fn(in_k = K, in_t = T)]
impl<K: Key, T: Data + Serialize> FileSink<K, T> {
    pub fn from_config(config_str: &str) -> Self {
        let config: OperatorConfig =
            serde_json::from_str(config_str).expect("Invalid config for FileSinkFunc");
        let table: SingleFileTable =
            serde_json::from_value(config.table).expect("Invalid table config for FileSinkFunc");
        Self {
            output_path: table.path,
            file: None,
            _phantom: PhantomData,
        }
    }

    fn name(&self) -> String {
        "SingleFileSink".to_string()
    }

    fn tables(&self) -> Vec<arroyo_rpc::grpc::TableDescriptor> {
        vec![arroyo_state::global_table('f', "file_sink")]
    }

    async fn on_start(&mut self, ctx: &mut Context<(), ()>) {
        let file_path = Path::new(&self.output_path);
        let parent = file_path.parent().unwrap();
        fs::create_dir_all(&parent).await.unwrap();
        let offset = ctx
            .state
            .get_global_keyed_state('f')
            .await
            .get(&self.output_path)
            .cloned()
            .unwrap_or_default();
        self.file = Some(
            OpenOptions::new()
                .write(true)
                .append(offset > 0)
                .create(offset == 0)
                .open(&self.output_path)
                .await
                .unwrap(),
        );
        if offset > 0 {
            self.file.as_mut().unwrap().set_len(offset).await.unwrap();
        }
    }

    async fn process_element(&mut self, record: &Record<K, T>, _ctx: &mut Context<(), ()>) {
        let row = serde_json::to_string(&record.value).unwrap();
        // row as a line
        self.file
            .as_mut()
            .unwrap()
            .write_all(format!("{}\n", row).as_bytes())
            .await
            .unwrap();
    }

    async fn handle_checkpoint(
        &mut self,
        _checkpoint_barrier: &arroyo_types::CheckpointBarrier,
        ctx: &mut crate::engine::Context<(), ()>,
    ) {
        self.file.as_mut().unwrap().flush().await.unwrap();
        let mut state = ctx.state.get_global_keyed_state('f').await;
        state
            .insert(
                self.output_path.clone(),
                self.file.as_ref().unwrap().metadata().await.unwrap().len(),
            )
            .await;
    }

    async fn on_close(&mut self, _ctx: &mut Context<(), ()>) {
        self.file.as_mut().unwrap().flush().await.unwrap();
    }
}