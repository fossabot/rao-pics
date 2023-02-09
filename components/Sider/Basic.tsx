import { rightBasicState, searchParamState } from "@/store";
import {
  Button,
  Col,
  Input,
  Rate,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useRecoilState, useRecoilValue } from "recoil";
import Image from "next/image";
import styles from "./basic.module.css";
import { handleImageAlt, handleImageUrl, transformByteToUnit } from "@/hooks";
import { useMemo } from "react";
import Link from "next/link";

const handleTime = (time: number) => {
  const [date, t] = new Date(time)
    .toLocaleString()
    .replace(/:\d+$/, "")
    .split(" ");

  return (
    date
      .split("/")
      .map((item) => (item.length === 1 ? "0" + item : item))
      .join("/") +
    " " +
    t
  );
};

const SiderBasic = () => {
  const rightBasic = useRecoilValue(rightBasicState);
  const image = useMemo(() => rightBasic.image, [rightBasic]);
  const [, setSearchParams] = useRecoilState(searchParamState);

  if (!image) {
    return (
      <div style={{ padding: 20 }}>
        <Button block disabled>
          {rightBasic.name}
        </Button>
        <Row style={{ marginTop: 20 }}>
          <Col>
            <Typography.Text strong>基本信息</Typography.Text>
          </Col>
        </Row>
        <div className={styles.baseInfo} style={{ marginTop: 20 }}>
          <Row align="middle">
            <Col span={12}>
              <Typography.Text>文件数</Typography.Text>
            </Col>
            <Col
              style={{ display: "flex", justifyContent: "flex-end" }}
              flex={1}
            >
              <Typography.Text type="secondary">
                {rightBasic.fileCount}
              </Typography.Text>
            </Col>
          </Row>
          <Row align={"middle"} style={{ marginTop: 10 }}>
            <Col span={12}>
              <Typography.Text>文件大小</Typography.Text>
            </Col>
            <Col
              style={{ display: "flex", justifyContent: "flex-end" }}
              flex={1}
            >
              <Typography.Text type="secondary">
                {transformByteToUnit(rightBasic.fileSize)}
              </Typography.Text>
            </Col>
          </Row>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 10 }}>
      <Row justify={"center"}>
        <Col>
          <Image
            width={200}
            height={0}
            style={{
              objectFit: "contain",
              borderRadius: 8,
              width: 200,
              height: image.height / (image.width / 200),
            }}
            src={handleImageUrl(image)}
            alt={handleImageAlt(image)}
          />
        </Col>
      </Row>

      <Row
        gutter={[2, 0]}
        style={{ marginTop: 20, height: 12 }}
        className={styles.palettes}
      >
        {JSON.parse(image.palettes)
          .slice(0, 8)
          .map((item, i) => (
            <Col key={i} flex={1}>
              <Tooltip title={`rgb(${item.color})`}>
                <div
                  style={{
                    backgroundColor: `rgb(${item.color})`,
                    height: 12,
                  }}
                />
              </Tooltip>
            </Col>
          ))}
      </Row>

      <Row style={{ marginTop: 20 }}>
        <Col flex={1}>
          <Input value={image.name} disabled />
        </Col>
      </Row>

      {image?.tags.length > 0 && (
        <Space size={[0, 8]} wrap style={{ marginTop: 10 }}>
          {image.tags.map((item) => (
            <Tag
              key={item.id}
              onClick={() => {
                setSearchParams((params) => ({
                  ...params,
                  tags: [item.id],
                }));
              }}
            >
              <Link href="/" title={item.id}>
                {item.id}
              </Link>
            </Tag>
          ))}
        </Space>
      )}

      <Row style={{ marginTop: 10 }}>
        <Col flex={1}>
          <Input value={image.annotation} disabled placeholder="暂无注释" />
        </Col>
      </Row>

      <Row style={{ marginTop: 10 }}>
        <Col flex={1}>
          <Input value={image.url} disabled placeholder="暂无链接" />
        </Col>
      </Row>

      <div style={{ marginTop: 20 }}>
        <Row>
          <Typography.Text strong>基本信息</Typography.Text>
        </Row>

        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>评分</Typography.Text>
          </Col>
          <Col>
            <Rate style={{ fontSize: 16 }} value={image.star || 0} disabled />
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>尺寸</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {image.width} x {image.height}
            </Typography.Text>
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>文件大小</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {transformByteToUnit(image.size)}
            </Typography.Text>
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>格式</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {image.ext.toLocaleUpperCase()}
            </Typography.Text>
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>添加日期</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {handleTime(image.mtime)}
            </Typography.Text>
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>创建日期</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {handleTime(image.btime)}
            </Typography.Text>
          </Col>
        </Row>
        <Row align="middle" style={{ marginTop: 10 }}>
          <Col span={8}>
            <Typography.Text>修改日期</Typography.Text>
          </Col>
          <Col>
            <Typography.Text type="secondary">
              {handleTime(image.lastModified)}
            </Typography.Text>
          </Col>
        </Row>

        <Row style={{ marginTop: 20 }}>
          <Col flex={1}>
            <Button
              block
              type="primary"
              onClick={() => {
                open(handleImageUrl(image, true));
              }}
            >
              查看原图
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SiderBasic;
