import { useEffect, useState } from "react";

import { trpc } from "../../utils/trpc";

import "./index.css";

interface Props {
  visable: boolean;
  onChange?: (visable: boolean) => void;
}

export const ConfigModal = (props: Props) => {
  const { data: config } = trpc.config.get.useQuery();
  const setConfig = trpc.config.update.useMutation({
    onSuccess() {
      props.onChange?.(false);
      setTimeout(() => {
        void window.app.relaunch();
      }, 1000);
    },
  });

  const [site, setSite] = useState<string>();

  useEffect(() => {
    if (config?.site) {
      setSite(config.site);
    }
  }, [config]);

  const save = () => {
    const regex = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;

    if (!config) return;
    if (!site || !regex.test(site)) return;

    if (config.site === site) return props.onChange?.(false);

    void setConfig.mutateAsync({
      ...config,
      site,
    });
  };

  return (
    <>
      {/* Put this part before </body> tag */}
      <input type="checkbox" checked={props.visable} id="config-modal" className="modal-toggle" />
      <div className="modal config-modal">
        <div className="modal-box">
          <h3 className="text-lg font-bold">配置信息</h3>

          <div className="mt-4">
            <p className="row">
              <span className="left">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
                <span>IP</span>
              </span>

              <span>{config?.ip}</span>
            </p>
            <p className="row">
              <span className="left">网页端口(自动分配)</span>
              <span> {config?.webPort}</span>
            </p>
            <p className="row">
              <span className="left">资源端口(自动分配)</span>
              <span>{config?.assetsPort}</span>
            </p>
            <p className="row">
              <span className="left">网址</span>
              <input value={site} onChange={(e) => setSite(e.target.value)} placeholder="eg: https://rao.pics" className="input input-xs input-bordered rounded-sm text-right" />
            </p>
          </div>

          <div className="modal-action">
            <button className="btn btn-sm btn-outline" onClick={() => props.onChange?.(false)}>
              取消
            </button>
            <button className="btn btn-sm" onClick={save}>
              保存并重启
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

ConfigModal.defaultProps = {
  visable: false,
};
